import { Redirect } from "expo-router";

export default function Index() {
  // Start direkt im Scan-Screen innerhalb der Tabs
  return <Redirect href="/(tabs)/scan" />;
}
