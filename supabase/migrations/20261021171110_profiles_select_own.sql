DROP POLICY "Public profiles are viewable by everyone." ON "public"."profiles";

CREATE POLICY "Enable users to view their own data only" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = id));
