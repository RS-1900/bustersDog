import { create } from "zustand";
import initialProducts from "../../../data/products.json";
import { CartItem, Product, CategoryType, ProductSize } from "../types/product";

export function getPriceForSize(product: Product, size?: ProductSize) {
  if (product.category !== 'bebida' || !size) {
    return product.price;
  }

  const prices = product.prices;
  return prices?.[size] ?? product.price + ({ S: 0, M: 5, L: 10 }[size]);
}

type ProductStore = {
  products: Product[];
  cart: CartItem[];
  toggleFavorite: (productId: string) => void;
  addToCart: (productId: string, selectedSize?: ProductSize) => boolean;
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

  addToCart: (productId: string, selectedSize?: ProductSize) => {
    const product = get().getProductById(productId);
    if (!product) return false;

    const size = product.category === 'bebida' ? selectedSize ?? 'M' : undefined;
    const existingItem = get().cart.find(
      (item) => item.id === product.id && item.selectedSize === size,
    );

    if (existingItem && existingItem.quantity >= 3) return false;

    const distinctProductCount = new Set(get().cart.map((item) => item.id)).size;
    const productAlreadyInCart = get().cart.some((item) => item.id === product.id);
    if (!productAlreadyInCart && distinctProductCount >= 3) return false;

    const cartPrice = getPriceForSize(product, size);
    set((state) => {
      const existingIndex = state.cart.findIndex(
        (item) => item.id === product.id && item.selectedSize === size,
      );

      if (existingIndex === -1) {
        return {
          cart: [...state.cart, {
            ...product,
            selectedSize: size,
            cartPrice,
            quantity: 1,
          }],
        };
      }

      return {
        cart: state.cart.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      };
    });

    return true;
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