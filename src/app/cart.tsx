import {Image, Text, View, StyleSheet, Pressable, Platform} from "react-native";
import {StatusBar} from "expo-status-bar";

const CartScreen = () => {
    return (
        <View>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
            <Text>cart</Text>
        </View>
    )
}
export default CartScreen