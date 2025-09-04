import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: "FoodScan" }} />
      <Stack.Screen name="scan"  options={{ title: "Scan" }} />
    </Stack>
  );
}