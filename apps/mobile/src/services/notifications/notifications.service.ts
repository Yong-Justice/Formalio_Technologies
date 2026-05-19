import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true
  })
});

export const notificationService = {
  async registerForPushNotifications() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Formalio',
        importance: Notifications.AndroidImportance.DEFAULT
      });
    }
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  },
  scheduleLocalReminder(title: string, body: string, seconds = 5) {
    return Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: { seconds }
    });
  }
};