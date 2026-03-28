import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Platform } from 'react-native';

const ONBOARDING_KEY = 'onboarding_completed';
const USER_PREFS_KEY = 'user_preferences';

interface UserPreferences {
  dietaryRestrictions: string[];
  hasCompletedOnboarding: boolean;
  hasActiveSubscription: boolean;
}

export const [OnboardingProvider, useOnboarding] = createContextHook(() => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    dietaryRestrictions: [],
    hasCompletedOnboarding: false,
    hasActiveSubscription: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadOnboardingStatus = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
        const prefs = await AsyncStorage.getItem(USER_PREFS_KEY);
        setHasCompletedOnboarding(completed === 'true');
        if (prefs) {
          setUserPreferences(JSON.parse(prefs));
        }
      } else {
        const completed = await SecureStore.getItemAsync(ONBOARDING_KEY);
        const prefs = await SecureStore.getItemAsync(USER_PREFS_KEY);
        setHasCompletedOnboarding(completed === 'true');
        if (prefs) {
          setUserPreferences(JSON.parse(prefs));
        }
      }
    } catch (error) {
      console.error('Error loading onboarding status:', error);
      setHasCompletedOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOnboardingStatus();
  }, [loadOnboardingStatus]);

  const completeOnboarding = useCallback(async (preferences: Partial<UserPreferences>) => {
    try {
      const newPreferences: UserPreferences = {
        ...userPreferences,
        ...preferences,
        hasCompletedOnboarding: true,
      };

      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        await AsyncStorage.setItem(USER_PREFS_KEY, JSON.stringify(newPreferences));
      } else {
        await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
        await SecureStore.setItemAsync(USER_PREFS_KEY, JSON.stringify(newPreferences));
      }

      setHasCompletedOnboarding(true);
      setUserPreferences(newPreferences);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  }, [userPreferences]);

  const updateSubscriptionStatus = useCallback(async (hasActiveSubscription: boolean) => {
    try {
      const newPreferences: UserPreferences = {
        ...userPreferences,
        hasActiveSubscription,
      };

      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(USER_PREFS_KEY, JSON.stringify(newPreferences));
      } else {
        await SecureStore.setItemAsync(USER_PREFS_KEY, JSON.stringify(newPreferences));
      }

      setUserPreferences(newPreferences);
    } catch (error) {
      console.error('Error updating subscription status:', error);
    }
  }, [userPreferences]);

  const resetOnboarding = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(ONBOARDING_KEY);
        await AsyncStorage.removeItem(USER_PREFS_KEY);
      } else {
        await SecureStore.deleteItemAsync(ONBOARDING_KEY);
        await SecureStore.deleteItemAsync(USER_PREFS_KEY);
      }

      setHasCompletedOnboarding(false);
      setUserPreferences({
        dietaryRestrictions: [],
        hasCompletedOnboarding: false,
        hasActiveSubscription: false,
      });
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  }, []);

  return useMemo(() => ({
    hasCompletedOnboarding,
    userPreferences,
    isLoading,
    completeOnboarding,
    updateSubscriptionStatus,
    resetOnboarding,
  }), [hasCompletedOnboarding, userPreferences, isLoading, completeOnboarding, updateSubscriptionStatus, resetOnboarding]);
});
