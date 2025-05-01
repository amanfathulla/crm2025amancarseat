
import { supabase } from '@/integrations/supabase/client';
import { MarketingContentStatus } from './types';

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
