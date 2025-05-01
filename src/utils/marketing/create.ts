
import { supabase } from '@/integrations/supabase/client';
import { MarketingContent, MarketingContentStatus, MarketingContentType } from './types';

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
