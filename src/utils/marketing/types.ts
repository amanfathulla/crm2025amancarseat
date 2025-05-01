
import { Database } from '@/integrations/supabase/types';

// Define strict types
export type MarketingContentStatus = 'pending' | 'completed';
export type MarketingContentType = 'event' | 'task' | 'reminder';

// Interface for the marketing content
export interface MarketingContent {
  id: string;
  title: string;
  description?: string | null;
  type: MarketingContentType;
  content_date: string;
  content_time?: string | null;
  status: MarketingContentStatus;
  created_at?: string | null;
  updated_at?: string | null;
}
