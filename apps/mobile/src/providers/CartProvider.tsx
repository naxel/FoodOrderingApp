import { createContext, PropsWithChildren, useContext, useState } from 'react';
import { Alert } from 'react-native';
import { CartItem, Product } from '@/types';
import { randomUUID } from 'expo-crypto';
import { useCreateOrder } from '@/api/orders';
import { useRouter } from 'expo-router';
import { initialisePaymentSheet, openPaymentSheet } from '@/lib/stripe';

type CartType = {
  items: CartItem[];
  addItem: (product: Product, size: CartItem['size']) => void;
  updateQuantity: (itemId: string, amount: -1 | 1) => void;
  total: number;
  checkout: () => void;
};

export const CartContext = createContext<CartType>({
  items: [],
  addItem: () => {},
  updateQuantity: () => {},
  total: 0,
  checkout: () => {},
});

const CartProvider = ({ children }: PropsWithChildren) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { mutate: createOrder } = useCreateOrder();
  const router = useRouter();

  const addItem = (product: Product, size: CartItem['size']) => {
    const existingItem = items.find((item) => item.product === product && item.size === size);
    if (existingItem) {
      updateQuantity(existingItem.id, 1);
      return;
    }
    const newCartItem: CartItem = {
      id: randomUUID(),
      product,
      product_id: product.id,
      size,
      quantity: 1,
    };

    setItems([...items, newCartItem]);
  };

  const updateQuantity = (itemId: string, amount: -1 | 1) => {
    setItems(
      items
        .map((item) => (item.id !== itemId ? item : { ...item, quantity: item.quantity + amount }))
        .filter((item) => item.quantity > 0),
    );
  };

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const clearCard = () => {
    setItems([]);
  };

  const checkout = async () => {
    const paymentIntentId = await initialisePaymentSheet(
      items.map(({ product_id, size, quantity }) => ({ product_id, size, quantity })),
    );
    if (!paymentIntentId) {
      return;
    }
    const paid = await openPaymentSheet();
    if (!paid) {
      return;
    }
    saveOrder(paymentIntentId);
  };

  const saveOrder = (paymentIntentId: string) => {
    createOrder(paymentIntentId, {
      onSuccess: (order) => {
        clearCard();
        Alert.alert('Success', 'Your order is confirmed!');
        router.push(`/(user)/orders/${order.id}`);
      },
      onError: (error) => {
        // Payment went through; create-order is safe to retry with the same PaymentIntent
        Alert.alert('Payment received, but the order was not saved', error.message, [
          { text: 'Retry', onPress: () => saveOrder(paymentIntentId) },
          { text: 'Cancel', style: 'cancel' },
        ]);
      },
    });
  };

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, total, checkout }}>
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;

export const useCart = () => useContext(CartContext);
