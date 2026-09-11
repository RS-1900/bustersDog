export type CategoryType = 'platillo' | 'bebida' | 'snack';
export type ProductSize = 'S' | 'M' | 'L';

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: CategoryType;
  isFavorite?: boolean;
  available: boolean;
  prices?: Partial<Record<ProductSize, number>>;
};

export type CartItem = Product & {
  selectedSize?: ProductSize;
  cartPrice: number;
  quantity: number;
};


export default function DummyTypeRoute() { return null; }
