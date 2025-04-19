export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string; // This will map to city or address in the database
  car_model: string;
  product: string;
  product_variation: string;
  sales_amount: number;
  gross_profit: number;
  paid_amount: number; // This field is already here
  order_date: string;
  order_status: string; // Added for order status tracking
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
  product_variation: string;
  sales_amount: number;
  gross_profit: number;
  paid_amount: number; // This field is already here
  order_date: string;
  order_status: string; // Added for order status tracking
  order_time?: string; // Optional field for order time
}
