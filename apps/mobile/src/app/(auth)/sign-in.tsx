import { StyleSheet, Text, type TextInputInstance } from 'react-native';
import React, { useRef, useState } from 'react';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import Button from '@/components/Button';
import FormInput from '@/components/FormInput';
import AuthScreen from '@/components/AuthScreen';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const SignInScreen = () => {
  const theme = Colors[useColorScheme()];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const passwordRef = useRef<TextInputInstance>(null);

  async function signInWithEmail() {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  }

  const canSubmit = email.trim() !== '' && password !== '' && !loading;

  return (
    <AuthScreen
      title="Welcome back"
      subtitle="Sign in to order your favourite pizza"
      footer={
        <Text style={[styles.footerText, { color: theme.muted }]}>
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" replace style={styles.link}>
            Sign up
          </Link>
        </Text>
      }
    >
      <FormInput
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setError('');
        }}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        submitBehavior="submit"
      />
      <FormInput
        ref={passwordRef}
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setError('');
        }}
        placeholder="Password"
        secure
        textContentType="password"
        autoComplete="password"
        returnKeyType="go"
        onSubmitEditing={() => {
          if (canSubmit) signInWithEmail();
        }}
      />
      <Text style={[styles.error, { color: theme.error }]}>{error}</Text>

      <Button onPress={signInWithEmail} disabled={!canSubmit} loading={loading} text="Sign in" />
    </AuthScreen>
  );
};

const styles = StyleSheet.create({
  error: {
    minHeight: 20,
    marginBottom: 4,
  },
  footerText: {
    fontSize: 15,
  },
  link: {
    color: Colors.light.tint,
    fontWeight: '600',
  },
});

export default SignInScreen;
