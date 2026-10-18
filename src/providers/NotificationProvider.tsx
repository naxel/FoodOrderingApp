import { PropsWithChildren, useEffect, useState } from 'react';
import { registerForPushNotificationsAsync } from '@/lib/notifications';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

const NotificationProvider = ({ children }: PropsWithChildren) => {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(
    undefined,
  );
  const { profile } = useAuth();

  const savePushToken = async (newToken: string | undefined) => {
    setExpoPushToken(newToken ?? '');
    if (!newToken) {
      return;
    }
    await supabase.from('profiles').update({ expo_push_token: newToken }).eq('id', profile.id);
  };

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => savePushToken(token));
    // .catch((error: any) => setExpoPushToken(`${error}`));

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
  return <>{children}</>;
};

export default NotificationProvider;
