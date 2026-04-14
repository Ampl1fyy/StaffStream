import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { session, profile, loading } = useAuthStore();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;

  if (profile?.role === 'business') return <Redirect href="/(business)" />;

  return <Redirect href="/(worker)" />;
}
