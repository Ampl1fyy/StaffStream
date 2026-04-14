import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function BusinessLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { paddingBottom: 6, height: 60 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Dashboard', tabBarIcon: ({ focused }) => <Text>{focused ? '📊' : '📊'}</Text> }}
      />
      <Tabs.Screen
        name="post-shift"
        options={{ title: 'Post Shift', tabBarIcon: ({ focused }) => <Text>{focused ? '➕' : '➕'}</Text> }}
      />
      <Tabs.Screen
        name="payments"
        options={{ title: 'Payments', tabBarIcon: ({ focused }) => <Text>{focused ? '💳' : '💳'}</Text> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ focused }) => <Text>{focused ? '🏢' : '🏢'}</Text> }}
      />
      <Tabs.Screen name="shift/[id]" options={{ href: null }} />
    </Tabs>
  );
}
