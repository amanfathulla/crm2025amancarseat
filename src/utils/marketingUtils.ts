
import { supabase } from '@/integrations/supabase/client';
import { formatDateToYYYYMMDD } from '@/utils/dateUtils';

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

/**
 * Deletes all marketing notes older than 2 months
 * @returns Result of the deletion operation
 */
export const deleteOldMarketingNotes = async () => {
  try {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const twoMonthsAgoStr = formatDateToYYYYMMDD(twoMonthsAgo);
    
    const { data, error } = await supabase
      .from('marketing_content')
      .delete()
      .lt('content_date', twoMonthsAgoStr)
      .select();
    
    if (error) throw error;
    
    return { success: true, deletedCount: data?.length || 0 };
    
  } catch (error) {
    console.error('Error deleting old marketing notes:', error);
    return { success: false, deletedCount: 0 };
  }
};

/**
 * Gets all marketing notes for the specified date range
 * @param startDate Start date in YYYY-MM-DD format
 * @param endDate End date in YYYY-MM-DD format
 * @returns Array of marketing notes in the date range
 */
export const getMarketingNotes = async (startDate: string, endDate: string) => {
  try {
    const { data, error } = await supabase
      .from('marketing_content')
      .select('*')
      .gte('content_date', startDate)
      .lte('content_date', endDate)
      .order('content_date', { ascending: true });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching marketing notes:', error);
    return [];
  }
};
