import { Stack } from 'expo-router';

// The list stays under an order opened from checkout or a push, so Back leads to it
// (router calls must pass { withAnchor: true }; deep links get it automatically)
export const unstable_settings = {
  anchor: 'index',
};

export default function OrdersStack() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Orders' }} />
    </Stack>
  );
}
