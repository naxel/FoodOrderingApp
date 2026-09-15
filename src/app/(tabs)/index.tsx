import { View } from 'react-native';
import products from '../../../assets/data/products'
import ProductListItem from "@/components/ProductListItem";

const product = products[0]

export default function MenuScreen() {
  return (
    <View>
      <ProductListItem product={products[0]} />
      <ProductListItem product={products[1]} />
    </View>
  );
}
