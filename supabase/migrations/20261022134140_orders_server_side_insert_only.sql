-- Orders and their items are created only by the create-order Edge Function
-- (service role, after Stripe confirms the payment). Clients can no longer insert them.
-- Push this only after the app version that calls create-order is released.
DROP POLICY "Users create own new orders" ON public.orders;
DROP POLICY "Users add items to own new orders" ON public.order_items;
