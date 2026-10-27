import { Button } from '@/components/ui/button';
import { signOut } from '@/app/(auth)/actions';

export default function Forbidden() {
  return (
    <>
      <h1>403 Forbidden</h1>
      <form action={signOut}>
        <Button type="submit" className="w-full">
          Log Out
        </Button>
      </form>
    </>
  );
}
