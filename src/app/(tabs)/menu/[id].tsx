import {Image, Text, View, StyleSheet} from "react-native";
import {Stack, useLocalSearchParams} from "expo-router";
import products from "@assets/data/products";
import {defaultPizzaImage} from "@components/ProductListItem";

const ProductDetailsScreen = () => {
    const {id} = useLocalSearchParams()

    const product = products.find(product => product.id.toString() === id)

    if (!product) {
        return <Text>Product not found</Text>
    }
    return (
        <View style={styles.container}>
            <Stack.Screen options={{title: product?.name}}/>
            <Image source={{uri: product?.image || defaultPizzaImage}} style={styles.image}/>
            <Text style={styles.price}>${product.price}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "white",
        flex: 1,
    },
    image: {
        width: '100%',
        aspectRatio: 1,

    },
    price: {
        fontSize: 18,
        fontWeight: "bold",
    }
})

export default ProductDetailsScreen;
