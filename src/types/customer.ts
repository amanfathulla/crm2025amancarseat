
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string; // maps to city or address in DB
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
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
  payment_source?: string; // billplz | whatsapp
  total_orders: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
  order_number?: number;
  seat_image_front?: string | null;
  seat_image_back?: string | null;
  seat_image_third_row?: string | null;
  additional_notes?: string | null;
  payment_type?: string | null;
  deposit_amount?: number | null;
  balance_amount?: number | null;
}

export interface CustomerFormData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  address?: string;
  car_model: string;
  product: string;
  product_variation: string;
  sales_amount: number;
  gross_profit: number;
  paid_amount: number;
  order_date: string;
  order_status: string;
  order_time?: string;
  payment_status?: string;
}
