import {Image, Text, View, StyleSheet, Pressable, Platform} from "react-native";
import {StatusBar} from "expo-status-bar";
import {useCart} from '@/providers/CartProvider'

const CartScreen = () => {
    const {items} = useCart()
    return (
        <View>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'}/>
            <Text>Cart items length {items.length}</Text>
        </View>
    )
}
export default CartScreen