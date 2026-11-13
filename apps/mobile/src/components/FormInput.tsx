import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputInstance,
  type TextInputProps,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

type FormInputProps = TextInputProps & {
  ref?: React.Ref<TextInputInstance>;
  // password field: hidden text and an eye button to show it
  secure?: boolean;
};

const FormInput = ({ secure, style, onFocus, onBlur, ...inputProps }: FormInputProps) => {
  const theme = Colors[useColorScheme()];
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      <TextInput
        // there is no visible label, so the placeholder doubles as the VoiceOver label
        accessibilityLabel={inputProps.placeholder}
        {...inputProps}
        secureTextEntry={secure && !showPassword}
        placeholderTextColor={theme.placeholder}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          {
            backgroundColor: theme.inputBackground,
            color: theme.text,
            borderColor: focused ? Colors.light.tint : theme.border,
          },
          secure && styles.withIcon,
          style,
        ]}
      />
      {secure && (
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
            tintColor={theme.placeholder}
            size={20}
          />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  input: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 17,
  },
  withIcon: {
    paddingRight: 48,
  },
  eye: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});

export default FormInput;
