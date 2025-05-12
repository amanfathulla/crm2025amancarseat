
export interface YearlySalesRecord {
  id: string;
  year: number;
  total_revenue: number;
  total_profit: number; // New field for tracking total profit
  quarter_1: number;
  quarter_2: number;
  quarter_3: number;
  quarter_4: number;
  created_at: string;
}

export interface YearlySalesFormData {
  year: number;
  total_revenue: number;
  total_profit: number; // New field for tracking total profit
  quarter_1: number;
  quarter_2: number;
  quarter_3: number;
  quarter_4: number;
}

export interface SalesAnalytics {
  currentYearRevenue: number;
  previousYearRevenue: number;
  percentageChange: number;
  quarterlyData: {
    quarter: string;
    currentYear: number;
    previousYear: number;
  }[];
}

// Add this interface to represent the structure of the yearly_sales table in Supabase
export interface YearlySalesTable {
  id: string;
  year: number;
  total_revenue: number;
  total_profit: number; // New field for tracking total profit
  quarter_1: number;
  quarter_2: number;
  quarter_3: number;
  quarter_4: number;
  created_at: string;
}

// New interface for sales_records table
export interface SalesRecord {
  id: string;
  date: string;
  amount: number;
  description: string | null;
  category: string | null;
  created_at: string;
}

// Form data for creating/editing sales records
export interface SalesRecordFormData {
  date: string;
  amount: number;
  description?: string;
  category?: string;
}

// Updated interface for yearly analytics display
export interface YearlyAnalytics {
  currentYearRevenue: number;
  previousYearRevenue: number;
  currentYearProfit: number; // New field for current year profit
  previousYearProfit: number; // New field for previous year profit
  percentageChange: number;
  yearlyData: {
    year: number;
    totalRevenue: number;
    totalProfit: number; // New field for profit in chart data
  }[];
  totalAllTimeRevenue: number;
  totalAllTimeProfit: number; // New field for all-time profit
  minYear: number;
  maxYear: number;
}
