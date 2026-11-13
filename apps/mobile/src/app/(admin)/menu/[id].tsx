import { Text, View, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { defaultPizzaImage } from '@components/ProductListItem';
import { SymbolView } from 'expo-symbols';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useProduct } from '@/api/products';
import RemoteImage from '@components/RemoteImage';
import Button from '@components/Button';
import { priceFormat } from '@foodordering/core/format';

const ProductDetailsScreen = () => {
  const theme = Colors[useColorScheme()];
  const { id: idString } = useLocalSearchParams<{ id: string }>();
  const id = parseFloat(idString);
  const { data: product, error, isLoading } = useProduct(id);
  const editHref = `/(admin)/menu/create?id=${id}` as const;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (error || !product) {
    return (
      <View style={styles.center}>
        <Text style={{ color: theme.muted }}>Failed to fetch product</Text>
      </View>
    );
  }

  const archived = product.archived_at !== null;

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
    >
      <Stack.Screen
        options={{
          title: product.name,
          headerRight: () => (
            <Link href={editHref} asChild>
              <Pressable hitSlop={10} accessibilityLabel="Edit product">
                {({ pressed }) => (
                  <SymbolView
                    name={{ ios: 'pencil', android: 'edit', web: 'edit' }}
                    size={22}
                    tintColor={Colors.light.tint}
                    style={{ opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <RemoteImage
        fallback={defaultPizzaImage}
        path={product.image}
        style={styles.image}
        resizeMode="cover"
      />

      <View style={styles.info}>
        <View
          style={[styles.status, { backgroundColor: archived ? theme.inputBackground : '#DCFCE7' }]}
        >
          <Text style={[styles.statusText, { color: archived ? theme.muted : '#15803D' }]}>
            {archived ? 'Archived' : 'In menu'}
          </Text>
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{product.name}</Text>
        <Text style={styles.price}>{priceFormat.format(product.price)}</Text>

        <Link href={editHref} asChild>
          <Button text="Edit product" />
        </Link>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingBottom: 24,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  info: {
    padding: 20,
  },
  status: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  price: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.light.tint,
    marginBottom: 16,
  },
});

export default ProductDetailsScreen;
