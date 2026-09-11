import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { shopStore } from "../stores/useProductStore";
export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
    void shopStore.getState().hydrate();
    void shopStore.getState().loadCatalog();
  }, []);
  return <Stack screenOptions={{ headerShown: false }} />;
}
