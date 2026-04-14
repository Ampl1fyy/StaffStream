import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function TabIcon({ label, active }: { label: string; active: boolean }) {
  return <Text className={active ? 'text-primary-600' : 'text-gray-400'}>{label}</Text>;
}

export default function WorkerLayout() {
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
        options={{
          title: 'Find Shifts',
          tabBarIcon: ({ focused }) => <TabIcon label="🔍" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="my-shifts"
        options={{
          title: 'My Shifts',
          tabBarIcon: ({ focused }) => <TabIcon label="📋" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Earnings',
          tabBarIcon: ({ focused }) => <TabIcon label="💰" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon label="👤" active={focused} />,
        }}
      />
      <Tabs.Screen name="shift/[id]" options={{ href: null }} />
    </Tabs>
  );
}
