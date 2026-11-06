// Payments
import { supabase } from '@/lib/supabase';
import { Alert } from 'react-native';
import { initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { CartItem } from '@/types';

export type PaymentCartItem = Pick<CartItem, 'product_id' | 'size' | 'quantity'>;

// Edge Functions return { error } with a non-2xx status; show that text instead of the generic one
export const functionErrorMessage = async (error: unknown) => {
  if (error instanceof FunctionsHttpError) {
    const body = await error.context.json().catch(() => null);
    if (body?.error) return body.error as string;
  }
  return error instanceof Error ? error.message : 'Unknown error';
};

const fetchPaymentSheetParams = async (items: PaymentCartItem[]) => {
  // Create payment session for our customer; the server prices the cart
  const { data, error } = await supabase.functions.invoke('payment-sheet', {
    body: { items },
  });

  if (data) {
    return data;
  }
  Alert.alert('Payment setup failed', await functionErrorMessage(error));
  return {};
};

// Returns the PaymentIntent id when the sheet is ready, otherwise null
export const initialisePaymentSheet = async (items: PaymentCartItem[]) => {
  const { paymentIntent, paymentIntentId, publishableKey, customerSessionClientSecret, customer } =
    await fetchPaymentSheetParams(items);

  if (!publishableKey || !paymentIntent) return null;

  const { error } = await initPaymentSheet({
    merchantDisplayName: 'Example, Inc.',
    customerId: customer,
    customerSessionClientSecret,
    paymentIntentClientSecret: paymentIntent,
    defaultBillingDetails: {
      name: 'Jane Doe',
      // email: 'test@test.com',
    },
  });
  if (error) {
    Alert.alert('Payment setup failed', error.message);
    return null;
  }
  return paymentIntentId as string;
};

export const openPaymentSheet = async () => {
  const { error } = await presentPaymentSheet();

  if (error) {
    Alert.alert(`Error code: ${error.code}`, error.message);
    return false;
  }
  return true;
};
