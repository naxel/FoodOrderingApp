import {Link, Stack} from "expo-router";
import {Menu} from "expo-router/build/primitives/menu";
import {Pressable} from "react-native";
import {SymbolView} from "expo-symbols";
import Colors from "@/constants/Colors";

export default function MenuStack() {
    return <Stack>
        <Stack.Screen name='index' options={{
            title: 'Menu',
            headerRight: () => (
                <Link href="/" asChild>
                    <Pressable style={{marginRight: 15}}>
                        {({pressed}) => (
                            <SymbolView
                                name={{ios: 'plus.square', android: 'shopping_cart', web: 'shopping_cart'}}
                                size={25}
                                tintColor={Colors.light.tint}
                                style={{opacity: pressed ? 0.5 : 1}}
                            />
                        )}
                    </Pressable>
                </Link>
            ),
        }}/>

        <Stack.Screen name='[id]' options={{
            title: 'Menu',
            headerRight: () => (
                <Link href="/" asChild>
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
    </Stack>
}
