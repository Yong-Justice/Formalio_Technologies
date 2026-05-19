import { Sentry } from './sentry';

export interface TelemetryUserContext {
  userId: string;
  businessId?: string;
  plan?: string;
}

export const observability = {
  setUserContext(context: TelemetryUserContext | null) {
    if (!context) {
      Sentry.setUser(null);
      Sentry.setContext('account', null);
      return;
    }

    Sentry.setUser({ id: context.userId });
    Sentry.setContext('account', {
      businessId: context.businessId,
      plan: context.plan,
    });
  },

  addNavigationBreadcrumb(route: string) {
    Sentry.addBreadcrumb({
      category: 'navigation',
      message: route,
      level: 'info',
    });
  },

  addBreadcrumb(category: string, message: string, data?: Record<string, unknown>) {
    Sentry.addBreadcrumb({
      category,
      message,
      data,
      level: 'info',
    });
  },

  captureException(error: unknown, context?: Record<string, unknown>) {
    Sentry.withScope((scope) => {
      if (context) scope.setContext('context', context);
      Sentry.captureException(error);
    });
  },
};
