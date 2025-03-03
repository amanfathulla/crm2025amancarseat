
export type MarketingContent = {
  id: string;
  title: string;
  description?: string;
  content_date: string;
  content_time?: string;
  type: string;
  status: 'completed' | 'pending';
  created_at?: string;
  updated_at?: string;
};

export type MarketingContentFormValues = Omit<MarketingContent, 'id' | 'created_at' | 'updated_at'>;
