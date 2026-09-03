import { create } from "zustand";
import initialProducts from "../../../data/products.json";
import { Product, CategoryType } from "../types/product";

type ProductStore = {
  products: Product[];
  toggleFavorite: (productId: string) => void;
  getProductById: (productId: string) => Product | undefined;
  getProductsByCategory: (category: CategoryType) => Product[];
};

export const useProductStore = create<ProductStore>((set, get) => ({
  products: initialProducts as Product[],


  //favs
  toggleFavorite: (productId: string) =>
    set((state) => ({
      products: state.products.map((product) =>
        product.id === productId
          ? { ...product, isFavorite: !product.isFavorite }
          : product
      ),
    })),

    //obtener producto por id
  getProductById: (productId: string) =>
    get().products.find((product) => product.id === productId),

  //obtener producto x categoria

  getProductsByCategory: (category: CategoryType) =>
    get().products.filter((product) => product.category === category),
}));

export default function DummyStoreRoute() { return null; }