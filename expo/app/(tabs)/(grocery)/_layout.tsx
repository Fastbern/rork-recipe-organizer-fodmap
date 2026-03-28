import { Stack } from "expo-router";
import Colors from "@/constants/colors";

export default function GroceryLayout() {
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
        name="grocery" 
        options={{ 
          title: "Grocery List",
        }} 
      />
    </Stack>
  );
}