import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import Colors from '../constants/Colors';

type ButtonProps = {
  text: string;
  loading?: boolean;
} & React.ComponentProps<typeof Pressable>;

const Button = ({ text, loading, disabled, ...pressableProps }: ButtonProps) => {
  return (
    <Pressable
      {...pressableProps}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.container,
        disabled && !loading && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {loading ? <ActivityIndicator color="white" /> : <Text style={styles.text}>{text}</Text>}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.tint,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginVertical: 8,
  },
  text: {
    fontSize: 17,
    fontWeight: '600',
    color: 'white',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
});

export default Button;
