import { Suspense, ReactNode } from 'react';
import { forbidden, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

async function AdminGate({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect('/login');

  const { data: isAdmin, error } = await supabase.rpc('is_admin');
  if (error || !isAdmin) forbidden();

  return children;
}

export default function AdminLayout({ children }: LayoutProps<'/'>) {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}
