import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { signOut } from './(auth)/actions';

export default async function Home() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  return (
    <>
      <div>{authData?.claims?.email}</div>
      <form action={signOut}>
        <Button type="submit" className="w-full">
          Log Out
        </Button>
      </form>
    </>
  );
}
