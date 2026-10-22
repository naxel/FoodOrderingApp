DROP POLICY "Allow authenticated users ALL operations" ON "public"."order_items";

DROP POLICY "All authenticated users All operations" ON "public"."orders";

DROP POLICY "Allow authenticated users ALL operations" ON "public"."products";

CREATE POLICY "Read items of visible orders" ON "public"."order_items"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_items.order_id) AND ((o.user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.is_admin() AS is_admin))))));

CREATE POLICY "Users add items to own new orders" ON "public"."order_items"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_items.order_id) AND (o.user_id = ( SELECT auth.uid() AS uid)) AND (o.status = 'New'::text)))));

CREATE POLICY "Admins update orders" ON "public"."orders"
  FOR UPDATE
  TO "authenticated"
  USING (( SELECT public.is_admin() AS is_admin))
  WITH CHECK (( SELECT public.is_admin() AS is_admin));

CREATE POLICY "Users create own new orders" ON "public"."orders"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND (status = 'New'::text)));

CREATE POLICY "Users read own orders, admins read all" ON "public"."orders"
  FOR SELECT
  TO "authenticated"
  USING (((user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.is_admin() AS is_admin)));

CREATE POLICY "Admins can delete products" ON "public"."products"
  FOR DELETE
  TO "authenticated"
  USING (( SELECT public.is_admin() AS is_admin));

CREATE POLICY "Admins can insert products" ON "public"."products"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (( SELECT public.is_admin() AS is_admin));

CREATE POLICY "Admins can update products" ON "public"."products"
  FOR UPDATE
  TO "authenticated"
  USING (( SELECT public.is_admin() AS is_admin))
  WITH CHECK (( SELECT public.is_admin() AS is_admin));

CREATE POLICY "Authenticated can read products" ON "public"."products"
  FOR SELECT
  TO "authenticated"
  USING (true);
