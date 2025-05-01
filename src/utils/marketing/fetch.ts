
import { supabase } from '@/integrations/supabase/client';
import { MarketingContent } from './types';
import { formatDateToYYYYMMDD } from '@/utils/dateUtils';

/**
 * Gets all marketing notes for the specified date range
 * @param startDate Start date in YYYY-MM-DD format
 * @param endDate End date in YYYY-MM-DD format
 * @returns Array of marketing notes in the date range
 */
export const getMarketingNotes = async (startDate: string, endDate: string): Promise<MarketingContent[]> => {
  try {
    const { data, error } = await supabase
      .from('marketing_content')
      .select('*')
      .gte('content_date', startDate)
      .lte('content_date', endDate)
      .order('content_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching marketing notes:', error);
      throw error;
    }
    
    // Validate and normalize the data to ensure it matches our expected types
    const validatedData = (data || []).map(item => ({
      ...item,
      // Ensure status is either 'pending' or 'completed'
      status: (item.status === 'completed' ? 'completed' : 'pending') as MarketingContentStatus,
      // Ensure type is valid
      type: (['event', 'task', 'reminder'].includes(item.type) 
        ? item.type 
        : 'task') as MarketingContentType
    }));
    
    return validatedData;
  } catch (error) {
    console.error('Error fetching marketing notes:', error);
    return [];
  }
};

/**
 * Gets notes that should be auto-deleted (older than 2 months)
 * @returns The count of notes to be deleted and the cutoff date
 */
export const getNotesToDelete = async () => {
  try {
    // Get date 2 months ago
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const twoMonthsAgoStr = formatDateToYYYYMMDD(twoMonthsAgo);
    
    // Count notes older than 2 months
    const { data, error } = await supabase
      .from('marketing_content')
      .select('id')
      .lt('content_date', twoMonthsAgoStr);
    
    if (error) {
      console.error('Error checking notes to delete:', error);
      return { count: 0, date: twoMonthsAgoStr };
    }
    
    return { count: data?.length || 0, date: twoMonthsAgoStr };
  } catch (error) {
    console.error('Unexpected error in getNotesToDelete:', error);
    return { count: 0, date: formatDateToYYYYMMDD(new Date()) };
  }
};
