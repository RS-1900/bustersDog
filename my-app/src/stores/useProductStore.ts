import { useStore } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import { z } from "zod";
import { createShopStore, type ShopState } from "./createShopStore";
import { createApiClient } from "../services/api-client";
import { sessionSchema } from "../types/product";
import { API_URL } from "../services/config";
import { createUuid } from "../services/uuid";
const sessionWithId = sessionSchema.extend({ localId: z.string().uuid() });
const key = () =>
  Platform.OS === "web" &&
  typeof globalThis.crypto !== "undefined" &&
  !globalThis.crypto.subtle
    ? Promise.resolve("busters.lan." + encodeURIComponent(API_URL))
    : Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        API_URL,
      ).then((hash) => "busters." + hash);
export const shopStore = createShopStore({
  api: createApiClient(API_URL),
  uuid: () => createUuid((bytes) => Crypto.getRandomValues(bytes)),
  now: Date.now,
  storage: {
    read: async () => {
      const name = await key();
      return Platform.OS === "web"
        ? sessionStorage.getItem(name)
        : AsyncStorage.getItem(name);
    },
    write: async (value) => {
      const name = await key();
      if (Platform.OS === "web") sessionStorage.setItem(name, value);
      else await AsyncStorage.setItem(name, value);
    },
  },
  vault: {
    read: async () => {
      const name = (await key()) + ".session";
      const raw =
        Platform.OS === "web"
          ? sessionStorage.getItem(name)
          : await SecureStore.getItemAsync(name);
      return raw ? sessionWithId.parse(JSON.parse(raw)) : null;
    },
    write: async (value) => {
      const name = (await key()) + ".session";
      const raw = JSON.stringify(value);
      if (Platform.OS === "web") sessionStorage.setItem(name, raw);
      else await SecureStore.setItemAsync(name, raw);
    },
  },
});
export const useProductStore = <T>(selector: (state: ShopState) => T): T =>
  useStore(shopStore, selector);
