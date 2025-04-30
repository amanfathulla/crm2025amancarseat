
import { supabase } from '@/integrations/supabase/client';
import { formatDateToYYYYMMDD } from '@/utils/dateUtils';

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
 * Creates a new marketing note
 * @param note The marketing note to create
 * @returns Result of the creation operation
 */
export const createMarketingNote = async (note: Omit<MarketingContent, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    console.log('Creating marketing note:', note);
    
    // Validate the note data before insertion
    if (!note.title || !note.content_date || !note.type) {
      return { 
        success: false, 
        error: 'Missing required fields',
        data: null
      };
    }
    
    // Ensure the status and type are valid
    const validatedNote = {
      ...note,
      status: note.status === 'completed' ? 'completed' : 'pending' as MarketingContentStatus,
      type: (['event', 'task', 'reminder'].includes(note.type) 
        ? note.type 
        : 'task') as MarketingContentType
    };
    
    console.log('Validated note:', validatedNote);
    
    const { data, error } = await supabase
      .from('marketing_content')
      .insert(validatedNote)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating marketing note:', error);
      return { 
        success: false, 
        error: error.message,
        data: null
      };
    }
    
    console.log('Created marketing note:', data);
    
    return { 
      success: true, 
      error: null,
      data
    };
  } catch (error: any) {
    console.error('Unexpected error creating marketing note:', error);
    return { 
      success: false, 
      error: error?.message || 'Unknown error occurred',
      data: null
    };
  }
};

/**
 * Updates the status of a marketing note
 * @param id Note ID
 * @param status New status
 * @returns Result of the update operation
 */
export const updateMarketingNoteStatus = async (id: string, status: MarketingContentStatus) => {
  try {
    const { error } = await supabase
      .from('marketing_content')
      .update({ 
        status: status === 'completed' ? 'completed' : 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating marketing note status:', error);
      return { 
        success: false, 
        error: error.message
      };
    }
    
    return { 
      success: true, 
      error: null
    };
  } catch (error: any) {
    console.error('Unexpected error updating marketing note status:', error);
    return { 
      success: false, 
      error: error?.message || 'Unknown error occurred'
    };
  }
};
