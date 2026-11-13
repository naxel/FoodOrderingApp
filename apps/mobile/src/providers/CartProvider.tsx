import { createContext, PropsWithChildren, useContext, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { CartItem, Product } from '@/types';
import { randomUUID } from 'expo-crypto';
import { useCreateOrder } from '@/api/orders';
import { useRouter } from 'expo-router';
import { initialisePaymentSheet, openPaymentSheet } from '@/lib/stripe';

// preparing: the payment sheet is being set up; saving: paid, the order is being created
export type CheckoutStatus = 'idle' | 'preparing' | 'saving';

type CartType = {
  items: CartItem[];
  addItem: (product: Product, size: CartItem['size']) => void;
  updateQuantity: (itemId: string, amount: -1 | 1) => void;
  total: number;
  checkout: () => void;
  checkoutStatus: CheckoutStatus;
};

export const CartContext = createContext<CartType>({
  items: [],
  addItem: () => {},
  updateQuantity: () => {},
  total: 0,
  checkout: () => {},
  checkoutStatus: 'idle',
});

const CartProvider = ({ children }: PropsWithChildren) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { mutate: createOrder } = useCreateOrder();
  const router = useRouter();
  const checkingOut = useRef(false);
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus>('idle');

  const addItem = (product: Product, size: CartItem['size']) => {
    const existingItem = items.find((item) => item.product_id === product.id && item.size === size);
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
    // A second tap would set up the sheet for a new PaymentIntent while the first flow still holds the old id
    if (checkingOut.current) {
      return;
    }
    checkingOut.current = true;
    setCheckoutStatus('preparing');
    try {
      const paymentIntentId = await initialisePaymentSheet(
        items.map(({ product_id, size, quantity }) => ({ product_id, size, quantity })),
      );
      if (!paymentIntentId) {
        setCheckoutStatus('idle');
        return;
      }
      const paid = await openPaymentSheet();
      if (!paid) {
        setCheckoutStatus('idle');
        return;
      }
      saveOrder(paymentIntentId);
    } catch (error) {
      setCheckoutStatus('idle');
      throw error;
    } finally {
      checkingOut.current = false;
    }
  };

  const saveOrder = (paymentIntentId: string) => {
    setCheckoutStatus('saving');
    createOrder(paymentIntentId, {
      onSuccess: (order) => {
        clearCard();
        setCheckoutStatus('idle');
        // Close the cart modal, then open the order inside the existing tabs:
        // push from the modal would stack a second copy of the tabs on top of it
        router.dismiss();
        router.navigate(`/(user)/orders/${order.id}`, { withAnchor: true });
      },
      onError: (error) => {
        setCheckoutStatus('idle');
        // Payment went through; create-order is safe to retry with the same PaymentIntent
        Alert.alert('Payment received, but the order was not saved', error.message, [
          { text: 'Retry', onPress: () => saveOrder(paymentIntentId) },
          { text: 'Cancel', style: 'cancel' },
        ]);
      },
    });
  };

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQuantity, total, checkout, checkoutStatus }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;

export const useCart = () => useContext(CartContext);
