import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { saveFCMToken } from '../lib/firebase';
import '../global.css';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { session, setSession, fetchProfile } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    fetchProfile(session.user.id);
    saveFCMToken(session.user.id);
  }, [session]);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    const navigate = () => {
      if (!session && !inAuthGroup) {
        router.replace('/(auth)/login');
      } else if (session && inAuthGroup) {
        router.replace('/');
      }
    };

    // Delay navigation until after the Root Layout has mounted to avoid
    // "Attempted to navigate before mounting the Root Layout component" errors.
    const t = setTimeout(navigate, 0);
    return () => clearTimeout(t);
  }, [session, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(worker)" />
      <Stack.Screen name="(business)" />
      <Stack.Screen name="qr-scan" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
