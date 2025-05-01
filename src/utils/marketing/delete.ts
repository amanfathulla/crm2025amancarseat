
import { supabase } from '@/integrations/supabase/client';
import { formatDateToYYYYMMDD } from '@/utils/dateUtils';

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
