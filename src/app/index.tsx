import { View, ActivityIndicator } from 'react-native';
import React from 'react';
import Button from '../components/Button';
import { Link, Redirect } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';

const index = () => {
  const { session, loading, isAdmin } = useAuth();

  if (loading) {
    return <ActivityIndicator />;
  }
  if (!session) {
    return <Redirect href={'/sign-in'} />;
  }
  if (!isAdmin) {
    return <Redirect href={'/(user)/menu'} />;
  }
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 10 }}>
      <Link href={'/(user)/menu'} asChild>
        <Button text="User" />
      </Link>
      <Link href={'/(admin)/menu'} asChild>
        <Button text="Admin" />
      </Link>
      <Button text="Sign out" onPress={() => supabase.auth.signOut()} />
    </View>
  );
};

export default index;
