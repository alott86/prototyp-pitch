import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function Home() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: "600", marginBottom: 16 }}>
        FoodScan – Prototyp
      </Text>
      <Link href="/scan" asChild>
        <Pressable style={{ padding: 14, borderRadius: 10, backgroundColor: "#111" }}>
          <Text style={{ color: "white", fontSize: 16 }}>Barcode scannen</Text>
        </Pressable>
      </Link>
    </View>
  );
}