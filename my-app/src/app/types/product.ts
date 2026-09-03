export type CategoryType = 'platillo' | 'bebida' | 'snack';

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: CategoryType;
  isFavorite?: boolean;
  available: boolean;
};


export default function DummyTypeRoute() { return null; }
