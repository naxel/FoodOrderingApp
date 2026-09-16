import { StyleSheet, Text, View, Image } from 'react-native';
import Colors from "@/constants/Colors";
import { Product } from '@/types';

type ProductListItemProps = {
    product: Product;
};

const ProductListItem = ({product}: ProductListItemProps) => {
    return (
        <View style={styles.container}>
            <Image source={{ uri: product.image || 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/food/default.png' }} style={styles.image} />
            <Text style={styles.title}>{product.name}</Text>
            <Text style={styles.price}>${product.price}</Text>
        </View>
    );
}

export default ProductListItem;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 20,
        overflow: 'hidden',
        maxWidth: '50%'
    },
    image: {
        width: '100%',
        aspectRatio: 1,
        alignSelf: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginVertical: 10,
    },
    price: {
        color: Colors.light.tint,
        fontWeight: 'bold',
        marginTop: 'auto',
    },
});
