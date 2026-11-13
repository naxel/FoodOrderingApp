import { Text, View, Platform, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useCart } from '@/providers/CartProvider';
import CartListItem from '@components/CartListItem';
import Button from '@components/Button';
import { priceFormat } from '@foodordering/core/format';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const CartScreen = () => {
  const theme = Colors[useColorScheme()];
  const { items, total, checkout, checkoutStatus } = useCart();

  // the sheet has closed, but the order is not saved yet: keep the user here until it is
  if (checkoutStatus === 'saving') {
    return (
      <View style={styles.empty}>
        <ActivityIndicator size="large" />
        <Text style={[styles.emptyTitle, styles.savingTitle, { color: theme.text }]}>
          Placing your order…
        </Text>
        <Text style={[styles.emptyText, { color: theme.muted }]}>Payment received</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>Your cart is empty</Text>
        <Text style={[styles.emptyText, { color: theme.muted }]}>
          Add a pizza from the menu to place an order
        </Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 10 }}>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
      <FlatList
        data={items}
        renderItem={({ item }) => <CartListItem cartItem={item} />}
        contentContainerStyle={{ gap: 10 }}
      />
      <Text style={{ marginTop: 20, fontSize: 20, fontWeight: '500', color: theme.text }}>
        Total: {priceFormat.format(total)}
      </Text>
      <Button text="Checkout" onPress={checkout} loading={checkoutStatus === 'preparing'} />
    </View>
  );
};

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  savingTitle: {
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default CartScreen;
