import { Stack } from "expo-router";
import Colors from "@/constants/colors";

export default function MealPlanLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.text.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen 
        name="meal-plan" 
        options={{ 
          title: "Meal Plan",
        }} 
      />
    </Stack>
  );
}