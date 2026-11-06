import { FlatList, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import OrderListItem from '@components/OrderListItem';
import OrderItemListItem from '@components/OrderItemListItem';
import { useOrderDetails } from '@/api/orders';
import { useUpdateOrderSubscription } from '@/api/orders/subscriptions';

const OrderDetailScreen = () => {
  const { id: idString } = useLocalSearchParams<{ id: string }>();
  const id = parseFloat(idString);
  const { data: order, error, isLoading } = useOrderDetails(id);
  useUpdateOrderSubscription(id);

  if (isLoading) {
    return <ActivityIndicator />;
  }
  if (error || !order) {
    return <Text>Failed to fetch order</Text>;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `Order #${order.id}` }} />

      <OrderListItem order={order} />

      <FlatList
        data={order.order_items}
        renderItem={({ item }) => <OrderItemListItem item={item} />}
        contentContainerStyle={{ gap: 10 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    flex: 1,
    gap: 10,
  },
});

export default OrderDetailScreen;
