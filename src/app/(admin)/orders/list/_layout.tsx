import { TopTabs } from 'expo-router/js-top-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrdersTabs() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top']}>
      <TopTabs>
        <TopTabs.Screen name="index" options={{ title: 'Active' }} />
        <TopTabs.Screen name="archive" options={{ title: 'Archive' }} />
      </TopTabs>
    </SafeAreaView>
  );
}
