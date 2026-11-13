import { PropsWithChildren, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { registerForPushNotificationsAsync } from '@/lib/notifications';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

const NotificationProvider = ({ children }: PropsWithChildren) => {
  const [expoPushToken, setExpoPushToken] = useState<string>();
  const { profile } = useAuth();

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then(setExpoPushToken)
      .catch((e) => console.warn('push registration failed', e));

    const openOrder = (response: Notifications.NotificationResponse) => {
      const orderId = response.notification.request.content.data?.orderId;
      if (typeof orderId === 'number') {
        router.push(`/(user)/orders/${orderId}`, { withAnchor: true });
      }
    };

    // A tap that cold-started the app happened before the listener below existed
    const launchResponse = Notifications.getLastNotificationResponse();
    if (launchResponse) {
      Notifications.clearLastNotificationResponse();
      openOrder(launchResponse);
    }
    const responseListener = Notifications.addNotificationResponseReceivedListener(openOrder);

    return () => {
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
  }, [expoPushToken, profile?.id, profile?.expo_push_token]);

  return <>{children}</>;
};

export default NotificationProvider;
