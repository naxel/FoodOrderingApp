import {StyleSheet, Text, View, Image, Pressable} from 'react-native';
import Colors from "@/constants/Colors";
import {Product} from '@/types';
import {Link, useSegments} from 'expo-router'

type ProductListItemProps = {
    product: Product;
};

export const defaultPizzaImage = 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/food/default.png'

const ProductListItem = ({product}: ProductListItemProps) => {
    const segments = useSegments();

    return (
        <Link href={`/${segments[0] as '(user)' | '(admin)'}/menu/${product.id}`} asChild>
            <Pressable style={styles.container}>
                <Image
                    source={{uri: product.image || defaultPizzaImage}}
                    style={styles.image}
                    resizeMode="contain"
                />
                <Text style={styles.title}>{product.name}</Text>
                <Text style={styles.price}>${product.price}</Text>
            </Pressable>
        </Link>
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
