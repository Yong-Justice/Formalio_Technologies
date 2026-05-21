import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { Env } from '@/config/env';
import { request } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { analytics } from '@/services/analytics/analytics.service';
import { flushOfflineQueue } from '@/services/offline/queue';
import { observability, type TelemetryUserContext } from '@/services/observability/observability.service';
import { secureKeys, secureStorage } from '@/services/storage/secureStorage';
import { getJson, setJson, storageKeys } from '@/services/storage/mmkv';

export const FORMALIO_NOTIFICATION_CATEGORIES = {
  TRANSACTION_RECEIVED: 'TRANSACTION_RECEIVED',
  PAYMENT_DUE: 'PAYMENT_DUE',
  SCORE_IMPROVED: 'SCORE_IMPROVED',
  SYNC_COMPLETE: 'SYNC_COMPLETE',
  SECURITY_ALERT: 'SECURITY_ALERT',
} as const;

export type FormalioNotificationCategory =
  (typeof FORMALIO_NOTIFICATION_CATEGORIES)[keyof typeof FORMALIO_NOTIFICATION_CATEGORIES];

type NotificationData = {
  type?: FormalioNotificationCategory;
  category?: FormalioNotificationCategory;
  transactionId?: string;
  paymentId?: string;
  alertId?: string;
  businessId?: string;
  url?: string;
  silent?: boolean;
  sync?: boolean;
};

type PushRegistrationResult = {
  token: string;
  registered: boolean;
};

const BACKGROUND_NOTIFICATION_TASK = 'formalio-background-notification-sync';
const isWeb = Platform.OS === 'web';

function getNotificationType(data: NotificationData, fallback?: string): FormalioNotificationCategory | undefined {
  return (data.type ?? data.category ?? fallback) as FormalioNotificationCategory | undefined;
}

function shouldRunSilentSync(data: NotificationData) {
  return data.silent === true || data.sync === true;
}

function routeForNotification(data: NotificationData, fallback?: string) {
  if (typeof data.url === 'string' && data.url.startsWith('/')) return data.url;

  switch (getNotificationType(data, fallback)) {
    case FORMALIO_NOTIFICATION_CATEGORIES.TRANSACTION_RECEIVED:
      return data.transactionId ? `/modals/transaction-detail?id=${encodeURIComponent(data.transactionId)}` : '/(tabs)/transactions';
    case FORMALIO_NOTIFICATION_CATEGORIES.PAYMENT_DUE:
      return data.paymentId ? `/modals/loan-request?paymentId=${encodeURIComponent(data.paymentId)}` : '/modals/loan-request';
    case FORMALIO_NOTIFICATION_CATEGORIES.SCORE_IMPROVED:
      return '/(tabs)/accounting';
    case FORMALIO_NOTIFICATION_CATEGORIES.SYNC_COMPLETE:
      return '/(tabs)/transactions';
    case FORMALIO_NOTIFICATION_CATEGORIES.SECURITY_ALERT:
      return data.alertId ? `/modals/security-alert?alertId=${encodeURIComponent(data.alertId)}` : '/modals/security-alert';
    default:
      return '/(tabs)/home';
  }
}

function getProjectId() {
  return Env.easProjectId && Env.easProjectId !== 'replace-with-eas-project-id' ? Env.easProjectId : undefined;
}

if (!isWeb && !TaskManager.isTaskDefined(BACKGROUND_NOTIFICATION_TASK)) {
  TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
    if (error) {
      observability.captureException(error, { task: BACKGROUND_NOTIFICATION_TASK });
      return;
    }

    const payload =
      ((data as { notification?: { request?: { content?: { data?: NotificationData } } } })?.notification?.request?.content
        ?.data as NotificationData | undefined) ?? (data as NotificationData);

    if (!shouldRunSilentSync(payload ?? {})) return;

    try {
      const result = await flushOfflineQueue();
      analytics.track('offline_sync_completed', {
        source: 'silent_notification',
        attempted: result.attempted,
        succeeded: result.succeeded,
        retrying: result.retrying,
        dead: result.dead,
      });
    } catch (syncError) {
      analytics.track('offline_sync_failed', { source: 'silent_notification' });
      observability.captureException(syncError, { task: BACKGROUND_NOTIFICATION_TASK });
    }
  });
}

if (!isWeb) {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const data = notification.request.content.data as NotificationData;
      const silent = shouldRunSilentSync(data);
      return {
        shouldShowAlert: !silent,
        shouldPlaySound: !silent,
        shouldSetBadge: true,
      };
    },
  });
}

async function configureNotificationCategories() {
  if (isWeb) return;

  await Promise.all(
    Object.values(FORMALIO_NOTIFICATION_CATEGORIES).map((category) =>
      Notifications.setNotificationCategoryAsync(category, [
        {
          identifier: 'OPEN',
          buttonTitle: 'Open Formalio',
          options: { opensAppToForeground: true },
        },
      ])
    )
  );
}

async function configureAndroidChannels() {
  if (Platform.OS !== 'android') return;

  await Promise.all([
    Notifications.setNotificationChannelAsync(FORMALIO_NOTIFICATION_CATEGORIES.TRANSACTION_RECEIVED, {
      name: 'Payments received',
      importance: Notifications.AndroidImportance.HIGH,
    }),
    Notifications.setNotificationChannelAsync(FORMALIO_NOTIFICATION_CATEGORIES.PAYMENT_DUE, {
      name: 'Payment reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    }),
    Notifications.setNotificationChannelAsync(FORMALIO_NOTIFICATION_CATEGORIES.SCORE_IMPROVED, {
      name: 'Mosika score',
      importance: Notifications.AndroidImportance.DEFAULT,
    }),
    Notifications.setNotificationChannelAsync(FORMALIO_NOTIFICATION_CATEGORIES.SYNC_COMPLETE, {
      name: 'Sync status',
      importance: Notifications.AndroidImportance.LOW,
    }),
    Notifications.setNotificationChannelAsync(FORMALIO_NOTIFICATION_CATEGORIES.SECURITY_ALERT, {
      name: 'Security alerts',
      importance: Notifications.AndroidImportance.MAX,
    }),
  ]);
}

async function getDevicePushToken() {
  if (isWeb) return null;

  const projectId = getProjectId();
  if (!projectId) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const token = await Notifications.getExpoPushTokenAsync({ projectId });

  return token.data;
}

function handleNotificationResponse(response: Notifications.NotificationResponse) {
  const notification = response.notification;
  const notificationId = notification.request.identifier;
  const lastTappedId = getJson<string | null>(storageKeys.notifications.lastTappedId, null);
  if (lastTappedId === notificationId) return;

  const data = notification.request.content.data as NotificationData;
  const type = getNotificationType(data);
  const route = routeForNotification(data);

  setJson(storageKeys.notifications.lastTappedId, notificationId);
  setJson(storageKeys.notifications.lastRoutedUrl, route);
  analytics.track('notification_tapped', { type, route });
  observability.addBreadcrumb('notification', 'notification_tapped', { type, route });
  router.push(route as any);
}

export const notificationService = {
  async configureNotificationInteractions() {
    if (isWeb) return undefined;

    await configureNotificationCategories();
    await configureAndroidChannels();
    await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch(() => undefined);

    const lastResponse = await Notifications.getLastNotificationResponseAsync();
    if (lastResponse) handleNotificationResponse(lastResponse);

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    return () => responseSubscription.remove();
  },

  async registerForPushNotifications() {
    await configureNotificationCategories();
    await configureAndroidChannels();
    const token = await getDevicePushToken();
    if (token) await secureStorage.set(secureKeys.expoPushToken, token);
    return token;
  },

  async syncPushTokenRegistration(
    context: TelemetryUserContext,
    reason: 'auth_success' | 'app_resume' | 'manual' = 'manual'
  ): Promise<PushRegistrationResult | null> {
    try {
      const token = await this.registerForPushNotifications();
      if (!token) return null;

      await request({
        method: 'POST',
        url: endpoints.notifications.devices,
        data: {
          expoPushToken: token,
          platform: Platform.OS,
          appVersion: Env.appVersion,
          buildNumber: Env.nativeBuildVersion,
          categories: Object.values(FORMALIO_NOTIFICATION_CATEGORIES),
          reason,
          userId: context.userId,
          businessId: context.businessId,
          plan: context.plan,
        },
      });

      await secureStorage.set(secureKeys.pushTokenSyncedAt, new Date().toISOString());
      analytics.track('push_token_registered', { reason, platform: Platform.OS });
      return { token, registered: true };
    } catch (error) {
      analytics.track('push_token_registration_failed', { reason, platform: Platform.OS });
      observability.captureException(error, { operation: 'push_token_registration', reason });
      const token = await secureStorage.get(secureKeys.expoPushToken);
      return token ? { token, registered: false } : null;
    }
  },

  async unregisterDevicePushToken() {
    const token = await secureStorage.get(secureKeys.expoPushToken);
    if (!token) return;

    await request({
      method: 'DELETE',
      url: endpoints.notifications.devices,
      data: { expoPushToken: token },
    }).catch((error) => observability.captureException(error, { operation: 'push_token_unregister' }));

    await secureStorage.remove(secureKeys.expoPushToken);
    await secureStorage.remove(secureKeys.pushTokenSyncedAt);
  },

  scheduleLocalReminder(title: string, body: string, seconds = 5) {
    return Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds },
    });
  },

  scheduleSyncCompleteNotification(result: { succeeded: number }) {
    return Notifications.scheduleNotificationAsync({
      content: {
        title: 'Synchronisation terminee',
        body: `${result.succeeded} operation(s) synchronisee(s).`,
        data: { type: FORMALIO_NOTIFICATION_CATEGORIES.SYNC_COMPLETE },
        categoryIdentifier: FORMALIO_NOTIFICATION_CATEGORIES.SYNC_COMPLETE,
      },
      trigger: null,
    });
  },
};
