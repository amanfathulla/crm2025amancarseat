
export interface ProductVariation {
  id: string;
  product_id: string;
  name: string; // e.g., "2 Seater", "5 Seater", "7 Seater"
  price: number;
  cost: number; // Adding cost field to each variation
}

export interface Product {
  id: string;
  name: string;
  price: number;
  cost: number | null;
  image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  status: string | null;
  category: string | null;
  description: string | null;
  sku: string | null;
  variations?: ProductVariation[];
}
