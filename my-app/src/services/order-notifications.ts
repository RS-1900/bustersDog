import { AppState, Platform } from "react-native";
import Constants from "expo-constants";
import { router } from "expo-router";
import { API_URL } from "./config";
import { readShoppingSession, shopStore } from "../stores/useProductStore";

// Load the native module only on supported installed apps, never on web/Expo Go.
export function startOrderNotifications(): () => void {
  if (Platform.OS === "web" || Constants.appOwnership === "expo")
    return () => {};
  let disposed = false;
  let busy = false;
  let lastRegistration = "";
  let lastToken = "";
  let lastResponse = "";
  let cleanupNative = () => {};
  async function sync() {
    if (
      disposed ||
      busy ||
      !shopStore.getState().hydrated ||
      !shopStore.getState().orders.length
    )
      return;
    busy = true;
    try {
      const session = await readShoppingSession();
      if (!session || Date.parse(session.expires_at) <= Date.now()) return;
      const notifications = await import("expo-notifications");
      if (Platform.OS === "android") {
        await notifications.setNotificationChannelAsync("orders", {
          name: "Estado de tus pedidos",
          importance: notifications.AndroidImportance.HIGH,
          sound: "default",
          vibrationPattern: [0, 250, 250, 250],
        });
      }
      let permission = await notifications.getPermissionsAsync();
      if (!permission.granted && permission.canAskAgain)
        permission = await notifications.requestPermissionsAsync();
      if (!permission.granted) {
        if (lastToken) await register(session.token, lastToken, false);
        lastRegistration = "";
        return;
      }
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;
      if (!projectId) return;
      const token = (await notifications.getExpoPushTokenAsync({ projectId }))
        .data;
      if (disposed) return;
      if (lastRegistration !== session.localId + token) {
        await register(session.token, token, true);
        lastToken = token;
        lastRegistration = session.localId + token;
      }
    } catch {
      console.warn(
        "No se pudieron activar los avisos de pedidos. Se reintentará al abrir la app.",
      );
    } finally {
      busy = false;
    }
  }
  async function register(session: string, token: string, enabled: boolean) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);
    try {
      const response = await fetch(API_URL + "/api/v1/notificaciones", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "X-Cafe-Request": "1",
          Authorization: "Bearer " + session,
        },
        body: JSON.stringify({ token, enabled }),
      });
      if (!response.ok) throw new Error("Push registration failed");
    } finally {
      clearTimeout(timeout);
    }
  }
  void import("expo-notifications")
    .then(async (notifications) => {
      if (disposed) return;
      notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      const open = async (
        response: import("expo-notifications").NotificationResponse | null,
      ) => {
        if (!response || disposed) return;
        const id = response.notification.request.content.data?.orderId;
        if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) return;
        const responseId = response.notification.request.identifier;
        if (lastResponse === responseId) return;
        lastResponse = responseId;
        await shopStore.getState().hydrate();
        if (
          disposed ||
          !shopStore.getState().orders.some((order) => order.id === id)
        )
          return;
        router.push({ pathname: "/orders/[id]", params: { id } });
        void shopStore.getState().refreshOrder(id);
        await notifications.clearLastNotificationResponseAsync();
      };
      const responseSubscription =
        notifications.addNotificationResponseReceivedListener(
          (r) => void open(r).catch(() => {}),
        );
      const receivedSubscription =
        notifications.addNotificationReceivedListener((n) => {
          const id = n.request.content.data?.orderId;
          if (
            typeof id === "string" &&
            shopStore.getState().orders.some((o) => o.id === id)
          )
            void shopStore.getState().refreshOrder(id);
        });
      const tokenSubscription = notifications.addPushTokenListener(() => {
        lastRegistration = "";
        void sync();
      });
      cleanupNative = () => {
        responseSubscription.remove();
        receivedSubscription.remove();
        tokenSubscription.remove();
      };
      void open(await notifications.getLastNotificationResponseAsync()).catch(
        () => {},
      );
      void sync();
    })
    .catch(() =>
      console.warn("Notificaciones no disponibles en esta compilación."),
    );
  const unsubscribe = shopStore.subscribe((state, previous) => {
    if (
      state.hydrated !== previous.hydrated ||
      state.orders.length !== previous.orders.length
    )
      void sync();
  });
  const foreground = AppState.addEventListener("change", (state) => {
    if (state === "active") void sync();
  });
  const retry = setInterval(() => {
    if (AppState.currentState === "active") void sync();
  }, 60000);
  return () => {
    disposed = true;
    unsubscribe();
    foreground.remove();
    cleanupNative();
    clearInterval(retry);
  };
}
