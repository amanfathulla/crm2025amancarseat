
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  car_model: string;
  product: string;
  order_date: string;
  total_orders: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  location: string;
  car_model: string;
  product: string;
  order_date: string;
}
