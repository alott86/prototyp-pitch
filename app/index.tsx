import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";

import { STORAGE_KEYS } from "../src/storageKeys";

export default function Index() {
  const [ready, setReady] = useState(false);
  const [seen, setSeen] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const value = await AsyncStorage.getItem(STORAGE_KEYS.onboardingSeen);
        if (!alive) return;
        setSeen(value === "1");
      } catch (err) {
        console.warn("Failed to read onboarding flag", err);
        if (!alive) return;
        setSeen(false);
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!ready) return null;

  if (seen) {
    return <Redirect href="/(tabs)/scan" />;
  }

  return <Redirect href="/onboarding" />;
}
