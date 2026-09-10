import { create } from "zustand";
import initialProducts from "../../../data/products.json";
import { Product, CategoryType } from "../types/product";

type ProductStore = {
  products: Product[];
  cart: Product[];
  toggleFavorite: (productId: string) => void;
  addToCart: (productId: string) => void;
  removeFromCart: (cartIndex: number) => void;
  getProductById: (productId: string) => Product | undefined;
  getProductsByCategory: (category: CategoryType) => Product[];
};

export const useProductStore = create<ProductStore>((set, get) => ({
  products: initialProducts as Product[],
  cart: [],


  //favs
  toggleFavorite: (productId: string) =>
    set((state) => ({
      products: state.products.map((product) =>
        product.id === productId
          ? { ...product, isFavorite: !product.isFavorite }
          : product
      ),
    })),

  addToCart: (productId: string) => {
    const product = get().getProductById(productId);
    if (product) {
      set((state) => ({ cart: [...state.cart, product] }));
    }
  },

  removeFromCart: (cartIndex: number) =>
    set((state) => ({
      cart: state.cart.filter((_, index) => index !== cartIndex),
    })),

    //obtener producto por id
  getProductById: (productId: string) =>
    get().products.find((product) => product.id === productId),

  //obtener producto x categoria

  getProductsByCategory: (category: CategoryType) =>
    get().products.filter((product) => product.category === category),
}));

export default function DummyStoreRoute() { return null; }