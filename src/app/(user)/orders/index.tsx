import { ActivityIndicator, FlatList, Text } from 'react-native';
import { Stack } from 'expo-router';
import OrderListItem from '@components/OrderListItem';
import { useMyOrderList } from '@/api/orders';

export default function OrdersScreen() {
  const { data: orders, error, isLoading } = useMyOrderList();
  if (isLoading) {
    return <ActivityIndicator />;
  }
  if (error) {
    return <Text>Failed to fetch products orders</Text>;
  }
  return (
    <>
      <Stack.Screen options={{ title: 'Orders' }} />
      <FlatList
        data={orders}
        contentContainerStyle={{ gap: 10, padding: 10 }}
        renderItem={({ item }) => <OrderListItem order={item} />}
      />
    </>
  );
}
