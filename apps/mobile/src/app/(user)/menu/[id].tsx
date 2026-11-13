import { Text, View, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { defaultPizzaImage } from '@components/ProductListItem';
import { useState } from 'react';
import Button from '@components/Button';
import { useCart } from '@/providers/CartProvider';
import { PizzaSize } from '@/types';
import { useProduct } from '@/api/products';
import RemoteImage from '@components/RemoteImage';
import { priceFormat } from '@foodordering/core/format';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const sizes: PizzaSize[] = ['S', 'M', 'L', 'XL'];

const ProductDetailsScreen = () => {
  const theme = Colors[useColorScheme()];
  const { id: idString } = useLocalSearchParams<{ id: string }>();
  const id = parseFloat(idString);
  const { addItem } = useCart();
  const { data: product, error, isLoading } = useProduct(id);

  const router = useRouter();

  const [selectedSize, setSelectedSize] = useState<PizzaSize>('M');

  const addToCart = () => {
    if (!product) return;

    addItem(product, selectedSize);
    router.push('/cart');
  };

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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: product.name }} />
      <ScrollView>
        <RemoteImage
          fallback={defaultPizzaImage}
          path={product.image}
          style={styles.image}
          resizeMode="cover"
        />

        <View style={styles.info}>
          <Text style={[styles.title, { color: theme.text }]}>{product.name}</Text>
          <Text style={styles.price}>{priceFormat.format(product.price)}</Text>

          <Text style={[styles.sectionTitle, { color: theme.muted }]}>Size</Text>
          <View style={styles.sizes}>
            {sizes.map((size) => {
              const selected = selectedSize === size;
              return (
                <Pressable
                  key={size}
                  onPress={() => setSelectedSize(size)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={[
                    styles.size,
                    selected
                      ? styles.sizeSelected
                      : { backgroundColor: theme.inputBackground, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.sizeText, { color: selected ? 'white' : theme.text }]}>
                    {size}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* pinned above the tab bar, so the main action is always in reach */}
      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <Button onPress={addToCart} text={`Add to cart · ${priceFormat.format(product.price)}`} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  info: {
    padding: 20,
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  sizes: {
    flexDirection: 'row',
    gap: 10,
  },
  size: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeSelected: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  sizeText: {
    fontSize: 17,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

export default ProductDetailsScreen;
