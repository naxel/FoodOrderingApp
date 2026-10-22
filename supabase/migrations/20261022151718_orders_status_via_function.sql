-- Order status changes go through the update-order-status Edge Function, which also
-- sends the push notification, so the client no longer needs other users' push tokens.
-- Push this only after the app version that calls update-order-status is in use.
DROP POLICY "Admins can view all profiles" ON public.profiles;
DROP POLICY "Admins update orders" ON public.orders;
