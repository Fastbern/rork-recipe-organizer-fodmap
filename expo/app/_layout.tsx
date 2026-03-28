import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { RecipeProvider } from "@/hooks/recipe-store";
import { FodmapProvider } from "@/hooks/fodmap-store";
import { AdaptationProvider } from "@/hooks/adaptation-store";
import { OnboardingProvider } from "@/hooks/onboarding-store";
import { trpc, trpcClient } from "@/lib/trpc";
import { View, ActivityIndicator, LogBox } from "react-native";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="onboarding" 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
        }} 
      />
      <Stack.Screen 
        name="personalize" 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
        }} 
      />
      <Stack.Screen 
        name="paywall" 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
        }} 
      />
      <Stack.Screen 
        name="add-recipe" 
        options={{ 
          presentation: "modal",
          title: "Add Recipe",
        }} 
      />
      <Stack.Screen 
        name="recipe/[id]" 
        options={{ 
          title: "Recipe Details",
        }} 
      />
      <Stack.Screen 
        name="edit-recipe/[id]" 
        options={{ 
          presentation: "modal",
          title: "Edit Recipe",
        }} 
      />
      <Stack.Screen 
        name="adapt-review" 
        options={{ 
          presentation: "modal",
          title: "Review Adaptation",
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    LogBox.ignoreLogs([
      "Deep imports from the 'react-native' package are deprecated",
    ]);
    const prepare = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 100));
      } finally {
        setIsReady(true);
        SplashScreen.hideAsync();
      }
    };

    prepare();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <OnboardingProvider>
          <FodmapProvider>
            <AdaptationProvider>
              <RecipeProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <RootLayoutNav />
                </GestureHandlerRootView>
              </RecipeProvider>
            </AdaptationProvider>
          </FodmapProvider>
        </OnboardingProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}