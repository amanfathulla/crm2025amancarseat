
export interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  cost: number | null;
  inventory: number | null;
  sales: number | null;
  sku: string | null;
  image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  status: string | null;
}
