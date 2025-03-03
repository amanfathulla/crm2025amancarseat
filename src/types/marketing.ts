
export interface MarketingEvent {
  id: string;
  title: string;
  date: Date | string;
  type: 'facebook' | 'instagram' | 'tiktok' | 'email' | 'general';
  description?: string;
}

export interface MarketingNote {
  id: string;
  title: string;
  content: string;
  date: string;
}

export interface MarketingTask {
  id: number;
  title: string;
  dueDate: string;
  completed: boolean;
  type: 'facebook' | 'instagram' | 'tiktok' | 'general';
}
