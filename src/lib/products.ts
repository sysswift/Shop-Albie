export type Product = {
  id: string;
  sku: string;
  name: string;
  price: number;
  category: string;
  image: string;
  gallery: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  description: string;
  inventory: number;
  isNew?: boolean;
  featured?: boolean;
};

export type Category = {
  slug: string;
  name: string;
  count: number;
};

/** Populated from Supabase once the backend is connected. */
export const categories: Category[] = [];

/** Populated from Supabase once the backend is connected. */
export const products: Product[] = [];

export const getProduct = (id: string) => products.find((p) => p.id === id);
