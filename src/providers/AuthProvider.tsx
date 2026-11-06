import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Profile } from '@/types';

type AuthData = {
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  isAdmin: boolean;
};
const AuthContext = createContext<AuthData>({
  session: null,
  loading: true,
  profile: null,
  isAdmin: false,
});

export default function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    const loadProfile = async (session: Session | null) => {
      setSession(session);
      if (!session) {
        setProfile(null);
      } else {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(data || null);
      }
      setLoading(false);
    };

    // fires INITIAL_SESSION on subscribe, so a separate getSession() is not needed
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // don't await Supabase calls inside the callback: it holds the auth lock and can deadlock
      setTimeout(() => loadProfile(session), 0);
    });
    return () => subscription.unsubscribe();
  }, []);
  return (
    <AuthContext.Provider
      value={{ session, loading, profile, isAdmin: profile?.group === 'ADMIN' }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
