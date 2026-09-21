import {Image, Text, View, StyleSheet, Pressable, Platform, FlatList} from "react-native";
import {StatusBar} from "expo-status-bar";
import {useCart} from '@/providers/CartProvider'
import CartListItem from "@components/CartListItem";

const CartScreen = () => {
    const {items} = useCart()
    return (
        <View>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'}/>
            <FlatList
                data={items}
                renderItem={({item}) => <CartListItem cartItem={item}/>}
                contentContainerStyle={{padding: 10, gap: 10}}
            />
        </View>
    )
}
export default CartScreen