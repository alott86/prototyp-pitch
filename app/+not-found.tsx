// app/+not-found.tsx
import { Link } from "expo-router";
import { View, Text } from "react-native";

export default function NotFound() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Text style={{ fontSize: 18, marginBottom: 12 }}>Dieser Screen existiert nicht.</Text>
      <Link href="/(tabs)/scan" style={{ fontSize: 16, color: "#1e90ff" }}>
        Zum Scanner
      </Link>
    </View>
  );
}