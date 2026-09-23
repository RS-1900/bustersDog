import { AppState } from "react-native";
import { io, type Socket } from "socket.io-client";
import { orderStatusEventSchema } from "../types/socket";
import { shopStore } from "../stores/useProductStore";
import { API_URL } from "./config";

const activeStatuses = new Set(["new", "preparing", "ready"]);
let socket: Socket | undefined;

function debug(message: string) {
  if (process.env.NODE_ENV !== "production")
    console.info(`[socket] ${message}`);
}

function instance() {
  socket ??= io(API_URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 15000,
    transports: ["websocket", "polling"],
  });
  return socket;
}

export function startOrderRealtime(): () => void {
  const client = instance();
  const joined = new Set<string>();
  let disposed = false;

  function desiredRooms() {
    return new Set(
      shopStore
        .getState()
        .orders.filter((order) => activeStatuses.has(order.status))
        .map((order) => order.id),
    );
  }
  function syncRooms() {
    if (disposed || !client.connected) return;
    const desired = desiredRooms();
    for (const id of joined) {
      if (!desired.has(id)) {
        client.emit("leave-order", id);
        joined.delete(id);
        debug(`leave order:${id}`);
      }
    }
    for (const id of desired) {
      if (!joined.has(id)) {
        client.emit("join-order", id);
        joined.add(id);
        debug(`join order:${id}`);
      }
    }
  }
  function connectIfNeeded() {
    if (disposed || AppState.currentState !== "active") return;
    const desired = desiredRooms();
    if (!desired.size) {
      syncRooms();
      if (client.connected) client.disconnect();
    } else if (!client.connected) client.connect();
    else syncRooms();
  }
  const onConnect = () => {
    debug("conectado");
    syncRooms();
    for (const id of desiredRooms()) void shopStore.getState().refreshOrder(id);
  };
  const onDisconnect = (reason: string) => {
    joined.clear();
    debug(`desconectado: ${reason}`);
  };
  const onConnectError = (error: Error) => debug(`error: ${error.message}`);
  const onStatus = (value: unknown) => {
    const parsed = orderStatusEventSchema.safeParse(value);
    if (!parsed.success) return;
    shopStore.getState().applyOrderStatus(parsed.data);
    syncRooms();
  };
  client.on("connect", onConnect);
  client.on("disconnect", onDisconnect);
  client.on("connect_error", onConnectError);
  client.on("order-status-updated", onStatus);
  const unsubscribe = shopStore.subscribe(() => connectIfNeeded());
  const appState = AppState.addEventListener("change", (state) => {
    if (state === "active") connectIfNeeded();
    else if (client.connected) {
      for (const id of joined) client.emit("leave-order", id);
      joined.clear();
      client.disconnect();
    }
  });
  connectIfNeeded();
  return () => {
    disposed = true;
    unsubscribe();
    appState.remove();
    for (const id of joined) client.emit("leave-order", id);
    joined.clear();
    client.off("connect", onConnect);
    client.off("disconnect", onDisconnect);
    client.off("connect_error", onConnectError);
    client.off("order-status-updated", onStatus);
    client.disconnect();
  };
}
