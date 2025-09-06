import { Redirect } from "expo-router";

export default function Index() {
  // Start immer auf Home innerhalb der Tabs
  return <Redirect href="/(tabs)/home" />;
}