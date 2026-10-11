import {Text, View, StyleSheet, Pressable, ActivityIndicator} from "react-native";
import {Stack, useLocalSearchParams, useRouter} from "expo-router";
import {defaultPizzaImage} from "@components/ProductListItem";
import {useState} from "react";
import Button from "@components/Button";
import {useCart} from "@/providers/CartProvider";
import {PizzaSize} from "@/types";
import {useProduct} from "@/api/products";
import RemoteImage from "@components/RemoteImage";

const sizes: PizzaSize[] = ['S', 'M', 'L', 'XL'];

const ProductDetailsScreen = () => {
    const {id: idString} = useLocalSearchParams()
    const {addItem} = useCart()
    const id = parseFloat(typeof idString === 'string' ? idString : idString[0])
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
            <Stack.Screen options={{title: product?.name}}/>
            <RemoteImage
                fallback={defaultPizzaImage}
                path={product?.image}
                style={styles.image}
                resizeMode="contain"
            />
            <Text style={styles.price}>Select size</Text>
            <View style={styles.sizes}>
                {sizes.map((size) => (
                    <Pressable
                        key={size}
                        onPress={() => {
                            setSelectedSize(size)
                        }}
                        style={[styles.size, {
                            backgroundColor: selectedSize === size ? 'gainsboro' : 'white'
                        }]}
                    >
                        <Text
                            style={[styles.sizeText, {
                                color: selectedSize === size ? 'black' : 'gray'
                            }]}
                        >{size}</Text>
                    </Pressable>
                ))}
            </View>
            <Text style={styles.price}>${product?.price}</Text>
            <Button onPress={addToCart} text="Add to cart"/>
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
    price: {
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 'auto'
    },
    sizes: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginVertical: 10,
    },
    size: {
        backgroundColor: "gainsboro",
        width: 50,
        aspectRatio: 1,
        borderRadius: 25,
        alignItems: "center",
        justifyContent: "center",
    },
    sizeText: {
        fontSize: 20,
        fontWeight: "500",
    },
})

export default ProductDetailsScreen;
