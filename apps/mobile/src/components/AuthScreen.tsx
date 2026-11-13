import React, { PropsWithChildren, ReactNode } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

type AuthScreenProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  // pinned to the bottom, e.g. the link to the other auth screen
  footer: ReactNode;
}>;

const AuthScreen = ({ title, subtitle, footer, children }: AuthScreenProps) => {
  const theme = Colors[useColorScheme()];
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundImage: theme.authBackground }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Pressable
        style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 12 }]}
        onPress={Keyboard.dismiss}
        accessible={false}
      >
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
            <View style={[styles.logo, { backgroundColor: theme.inputBackground }]}>
              <Text style={styles.logoEmoji}>🍕</Text>
            </View>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>{subtitle}</Text>
          </Animated.View>
          {children}
        </View>
        <View style={styles.footer}>{footer}</View>
      </Pressable>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    boxShadow: '0 8px 24px rgba(120, 60, 0, 0.15)',
  },
  logoEmoji: {
    fontSize: 52,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
  },
});

export default AuthScreen;
