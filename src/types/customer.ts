
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string; // This will map to city or address in the database
  address?: string; // Full address
  car_model: string;
  product: string;
  product_variation: string;
  sales_amount: number;
  gross_profit: number;
  paid_amount: number;
  order_date: string;
  order_status: string;
  order_time?: string;
  payment_status?: string; // deposit, fullpayment, cod
  total_orders: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerFormData {
  id?: string; // Optional for new customers
  name: string;
  email: string;
  phone: string;
  location: string;
  address?: string; // Full address
  car_model: string;
  product: string;
  product_variation: string;
  sales_amount: number;
  gross_profit: number;
  paid_amount: number;
  order_date: string;
  order_status: string;
  order_time?: string;
  payment_status?: string; // deposit, fullpayment, cod
}
