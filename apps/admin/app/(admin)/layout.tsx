import { Suspense, ReactNode } from 'react';
import { forbidden, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getClaims } from '@/lib/auth';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { ModeToggle } from '@/components/mode-toggle';
import { signOut } from '@/app/(auth)/actions';
import { Button } from '@/components/ui/button';

async function AdminGate({ children }: { children: ReactNode }) {
  const claims = await getClaims();
  if (!claims) redirect('/login');

  const supabase = await createClient();
  const { data: isAdmin, error } = await supabase.rpc('is_admin');
  if (error || !isAdmin) forbidden();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <span className="ml-auto text-sm text-muted-foreground">{claims.email}</span>
          <ModeToggle />
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              Log Out
            </Button>
          </form>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function AdminLayout({ children }: LayoutProps<'/'>) {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}
