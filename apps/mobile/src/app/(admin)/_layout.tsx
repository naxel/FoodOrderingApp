import { SymbolView } from 'expo-symbols';
import { Redirect, Tabs } from 'expo-router';
import Colors from '@/constants/Colors';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useAuth } from '@/providers/AuthProvider';

export default function TabLayout() {
  const { session, isAdmin, loading } = useAuth();
  const headerShown = useClientOnlyValue(false, true);
  if (loading) {
    return null;
  }
  // explicit targets: "/" from inside this group resolves to (admin)/index and loops back here
  if (!session) {
    return <Redirect href="/sign-in" />;
  }
  if (!isAdmin) {
    return <Redirect href="/(user)/menu" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        tabBarInactiveTintColor: '#8E8E93',
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown,
        // dark bar in both themes marks the admin side apart from the user tabs
        tabBarStyle: { backgroundColor: '#1C1C1E', borderTopColor: '#2C2C2E' },
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'menucard',
                android: 'menu',
                web: 'menu',
              }}
              tintColor={color}
              size={20}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          headerShown: false,
          tabBarIcon: ({ color }) => (
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
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'person',
                android: 'person',
                web: 'person',
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
