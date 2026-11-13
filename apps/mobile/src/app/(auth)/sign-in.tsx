import {
  View,
  Text,
  TextInput,
  type TextInputInstance,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Keyboard,
} from 'react-native';
import React, { useState, useRef } from 'react';
import Button from '../../components/Button';
import Colors from '../../constants/Colors';
import { Link, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { SymbolView } from 'expo-symbols';

const SignInScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: 'Sign in' }} />
      <Pressable style={styles.container} onPress={Keyboard.dismiss} accessible={false}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError('');
          }}
          placeholder="jon@gmail.com"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          submitBehavior="submit"
        />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            ref={passwordRef}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError('');
            }}
            style={[styles.input, styles.passwordInput]}
            secureTextEntry={!showPassword}
            textContentType="password"
            autoComplete="password"
            returnKeyType="go"
            onSubmitEditing={() => {
              if (canSubmit) signInWithEmail();
            }}
          />
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            style={styles.eye}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <SymbolView
              name={{
                ios: showPassword ? 'eye.slash' : 'eye',
                android: showPassword ? 'visibility_off' : 'visibility',
                web: showPassword ? 'visibility_off' : 'visibility',
              }}
              tintColor="gray"
              size={20}
            />
          </Pressable>
        </View>
        <Text style={styles.error}>{error}</Text>

        <Button
          onPress={signInWithEmail}
          disabled={!canSubmit}
          text={loading ? 'Signing in...' : 'Sign in'}
        />
        <Link href="/sign-up" style={styles.textButton}>
          Create an account
        </Link>
      </Pressable>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: 'center',
    flex: 1,
  },
  label: {
    color: 'gray',
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    padding: 10,
    marginTop: 5,
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 5,
  },
  textButton: {
    alignSelf: 'center',
    fontWeight: 'bold',
    color: Colors.light.tint,
    marginVertical: 10,
  },
  error: {
    color: '#D93025',
    marginBottom: 10,
  },
  passwordRow: {
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 44,
  },
  eye: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 12,
    top: 14,
  },
});

export default SignInScreen;
