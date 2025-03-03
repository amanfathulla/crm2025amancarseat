
export interface YearlySalesRecord {
  id: string;
  year: number;
  total_revenue: number;
  quarter_1: number;
  quarter_2: number;
  quarter_3: number;
  quarter_4: number;
  created_at: string;
}

export interface YearlySalesFormData {
  year: number;
  total_revenue: number;
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
  quarter_1: number;
  quarter_2: number;
  quarter_3: number;
  quarter_4: number;
  created_at: string;
}
