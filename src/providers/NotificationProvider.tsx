import { PropsWithChildren, useEffect, useState } from 'react';
import { registerForPushNotificationsAsync } from '@/lib/notifications';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

const NotificationProvider = ({ children }: PropsWithChildren) => {
  const [expoPushToken, setExpoPushToken] = useState<string>();
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(
    undefined,
  );
  const { profile } = useAuth();

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then(setExpoPushToken)
      .catch((e) => console.warn('push registration failed', e));

    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log(response);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  useEffect(() => {
    if (!expoPushToken || !profile?.id) return;
    if (profile.expo_push_token === expoPushToken) return; // зайвий write не потрібен

    supabase
      .from('profiles')
      .update({ expo_push_token: expoPushToken })
      .eq('id', profile.id)
      .then(({ error }) => {
        if (error) console.warn('save push token failed', error);
      });
  }, [expoPushToken, profile?.id]);

  return <>{children}</>;
};

export default NotificationProvider;
