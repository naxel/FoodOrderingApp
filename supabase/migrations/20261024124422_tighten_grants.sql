-- Least privilege for the Data API roles. RLS still filters rows; these grants decide
-- which operations and columns a role can use at all. The app does nothing without
-- signing in, and orders / order_items / profiles rows are written only by Edge Functions
-- (service role) or the on_auth_user_created trigger.

-- 1. profiles: clients never insert a profile (the trigger does), so they cannot
--    insert one with "group" = 'ADMIN' either
DROP POLICY "Users can insert their own profile." ON public.profiles;

-- 2. Table grants: anon gets nothing, authenticated only what its policies allow.
--    REVOKE ALL also drops column grants, so the profiles UPDATE columns are granted again.
REVOKE ALL ON public.products, public.orders, public.order_items, public.profiles
  FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT ON public.orders, public.order_items TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (username, full_name, avatar_url, website, expo_push_token, updated_at)
  ON public.profiles TO authenticated;

-- 3. Sequences: only admins insert products from the client
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.products_id_seq TO authenticated;

-- 4. Functions: every function in public is an RPC endpoint
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;

-- 5. New objects created by migrations (role postgres) are no longer open to anon.
--    authenticated still gets the default grants: enable RLS on every new table.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon;
