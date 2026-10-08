import {Image, Text, View, StyleSheet, Pressable, ActivityIndicator} from "react-native";
import {Link, Stack, useLocalSearchParams, useRouter} from "expo-router";
import {defaultPizzaImage} from "@components/ProductListItem";
import {useState} from "react";
import {useCart} from "@/providers/CartProvider";
import {PizzaSize} from "@/types";
import {SymbolView} from "expo-symbols";
import Colors from "@/constants/Colors";
import {useProduct} from "@/api/products";

const sizes: PizzaSize[] = ['S', 'M', 'L', 'XL'];

const ProductDetailsScreen = () => {
    const {id: idString} = useLocalSearchParams()
    const {addItem} = useCart()
    const id = parseFloat(typeof idString === 'string' ? idString :idString[0])
    const {data: product, error, isLoading} = useProduct(id)

    const router = useRouter()

    const [selectedSize, setSelectedSize] = useState<PizzaSize>('M')

    const addToCart = () => {
        console.warn('AddToCart', selectedSize)
        if (!product) return

        addItem(product, selectedSize)
        router.push('/cart')
    }

    if (isLoading) {
        return <ActivityIndicator/>
    }
    if (error) {
        return <Text>Failed to fetch products</Text>
    }
    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Menu',
                    headerRight: () => (
                        <Link href={`/(admin)/menu/create?id=${id}`} asChild>
                            <Pressable style={{marginRight: 15}}>
                                {({pressed}) => (
                                    <SymbolView
                                        name={{ios: 'pencil', android: 'shopping_cart', web: 'shopping_cart'}}
                                        size={25}
                                        tintColor={Colors.light.tint}
                                        style={{opacity: pressed ? 0.5 : 1}}
                                    />
                                )}
                            </Pressable>
                        </Link>
                    ),
                }}/>
            <Stack.Screen options={{title: product?.name}}/>
            <Image source={{uri: product?.image || defaultPizzaImage}} style={styles.image}/>
            <Text style={styles.title}>{product.name}</Text>
            <Text style={styles.price}>${product.price}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "white",
        padding: 10,
        flex: 1,
    },
    image: {
        width: '100%',
        aspectRatio: 1,

    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
    },
    price: {
        fontSize: 18,
        fontWeight: "bold",
    },
})

export default ProductDetailsScreen;
