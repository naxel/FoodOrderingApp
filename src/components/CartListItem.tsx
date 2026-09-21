import {View, Text, StyleSheet, Image, Pressable} from 'react-native';
import React from 'react';
import Colors from '../constants/Colors';
import {CartItem} from "@/types";
import {Link} from 'expo-router';
import {defaultPizzaImage} from "@components/ProductListItem";
import {useCart} from "@/providers/CartProvider";
import {SymbolView} from "expo-symbols";

type CartListItemProps = {
    cartItem: CartItem;
};

const CartListItem = ({cartItem}: CartListItemProps) => {
    const {updateQuantity} = useCart();
    return (
        <View style={styles.container}>
            <Image
                source={{uri: cartItem.product.image || defaultPizzaImage}}
                style={styles.image}
                resizeMode="contain"
            />
            <View style={{flex: 1}}>
                <Text style={styles.title}>{cartItem.product.name}</Text>
                <View style={styles.subtitleContainer}>
                    <Text style={styles.price}>${cartItem.product.price.toFixed(2)}</Text>
                    <Text>Size: {cartItem.size}</Text>
                </View>
            </View>
            <View style={styles.quantitySelector}>
                <Pressable onPress={() => updateQuantity(cartItem.id, -1)}>
                    <SymbolView
                        name={{ios: 'minus', android: 'heart_minus', web: 'heart_minus'}}
                        size={25}
                        tintColor="gray"
                        style={{padding: 5}}
                    />
                </Pressable>

                <Text style={styles.quantity}>{cartItem.quantity}</Text>
                <Pressable onPress={() => updateQuantity(cartItem.id, 1)}>
                    <SymbolView
                        name={{ios: 'plus', android: 'plus_one', web: 'plus_one'}}
                        size={25}
                        tintColor="gray"
                        style={{padding: 5}}
                    />
                </Pressable>

            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 5,
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    image: {
        width: 75,
        aspectRatio: 1,
        alignSelf: 'center',
        marginRight: 10,
    },
    title: {
        fontWeight: '500',
        fontSize: 16,
        marginBottom: 5,
    },
    subtitleContainer: {
        flexDirection: 'row',
        gap: 5,
    },
    quantitySelector: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
        marginVertical: 10,
    },
    quantity: {
        fontWeight: '500',
        fontSize: 18,
    },
    price: {
        color: Colors.light.tint,
        fontWeight: 'bold',
    },
});

export default CartListItem;
