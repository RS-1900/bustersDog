import { useStore } from "zustand";
import { API_URL } from "../services/config";
import { createPromotionsClient } from "../services/promotions-client";
import { createPromotionsStore } from "./createPromotionsStore";

const store = createPromotionsStore(createPromotionsClient(API_URL));
export const usePromotions = () => useStore(store);
export type { Promotion } from "../types/promotion";
