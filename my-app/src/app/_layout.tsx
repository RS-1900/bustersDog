import { useCallback, useEffect, useState } from "react";
import { AppState, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as NativeSplash from "expo-splash-screen";
import BrandSplash from "../components/splash";
import { shopStore } from "../stores/useProductStore";
import { startOrderNotifications } from "../services/order-notifications";
void NativeSplash.preventAutoHideAsync().catch(() => {});
export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const finish = useCallback(() => setShowSplash(false), []);
  const ready = useCallback(() => {
    void NativeSplash.hideAsync().catch(() => {});
  }, []);
  useEffect(() => {
    void shopStore.getState().hydrate();
    void shopStore.getState().loadCatalog();
  }, []);
  useEffect(() => startOrderNotifications(), []);
  useEffect(() => {
    const refresh = () => {
      if (AppState.currentState === "active") {
        void shopStore.getState().refreshCafeStatus();
      }
    };
    refresh();
    const timer = setInterval(refresh, 15000);
    const subscription = AppState.addEventListener("change", refresh);
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#FFFFFF" },
          }}
        />
        {showSplash && <BrandSplash onFinish={finish} onReady={ready} />}
      </View>
    </SafeAreaProvider>
  );
}
