import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboarding } from '@/hooks/onboarding-store';

export default function Index() {
  const { hasCompletedOnboarding, isLoading } = useOnboarding();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (hasCompletedOnboarding) {
        router.replace('/(tabs)/(home)/home');
      } else {
        router.replace('/onboarding');
      }
    }
  }, [hasCompletedOnboarding, isLoading, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#4a7c28" />
    </View>
  );
}