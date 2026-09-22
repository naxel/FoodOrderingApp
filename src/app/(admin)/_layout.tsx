import {SymbolView} from 'expo-symbols';
import {Link, Tabs} from 'expo-router';
import {Platform, Pressable} from 'react-native';

import Colors from '@/constants/Colors';
import {useColorScheme} from '@/components/useColorScheme';
import {useClientOnlyValue} from '@/components/useClientOnlyValue';

export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors.light.background,
                tabBarInactiveTintColor: 'gainsboro',
                // Disable the static render of the header on web
                // to prevent a hydration error in React Navigation v6.
                headerShown: useClientOnlyValue(false, true),
                tabBarStyle: {backgroundColor: Colors.light.tint},
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
                name="two"
                options={{
                    title: 'Orders',
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
