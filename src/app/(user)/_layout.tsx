import {SymbolView} from 'expo-symbols';
import {Link, Redirect, Tabs} from 'expo-router';
import {Platform, Pressable} from 'react-native';

import Colors from '@/constants/Colors';
import {useColorScheme} from '@/components/useColorScheme';
import {useClientOnlyValue} from '@/components/useClientOnlyValue';
import {useAuth} from "@/providers/AuthProvider";

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const {session} = useAuth()
    const headerShown = useClientOnlyValue(false, true)

    if (!session) {
        return <Redirect href={'/sign-in'} />
    }

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors[colorScheme].tint,
                // Disable the static render of the header on web
                // to prevent a hydration error in React Navigation v6.
                headerShown,
            }}>
            <Tabs.Screen name="index" options={{href: null}}/>
            <Tabs.Screen
                name="menu"
                options={{
                    title: 'Menu',
                    headerShown: false,
                    tabBarIcon: ({color}) => (
                        <SymbolView
                            name={{
                                ios: 'menucard',
                                android: 'menu',
                                web: 'menu',
                            }}
                            tintColor={color}
                            size={20}
                        />
                    )
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    title: 'Orders',
                    headerShown: false,
                    tabBarIcon: ({color}) => (
                        <SymbolView
                            name={{
                                ios: 'list.bullet',
                                android: 'list',
                                web: 'list',
                            }}
                            tintColor={color}
                            size={20}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}
