
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MarketingEvent } from '@/types/marketing';
import { useToast } from '@/hooks/use-toast';
import { formatDateToYYYYMMDD } from '@/utils/dateUtils';

export function useMarketingEvents() {
  const [events, setEvents] = useState<MarketingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch events from Supabase
  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('marketing_events')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      // Convert string dates to Date objects
      const formattedEvents = data.map(event => ({
        ...event,
        date: new Date(event.date)
      }));
      
      setEvents(formattedEvents);
    } catch (err) {
      console.error('Error fetching marketing events:', err);
      setError('Failed to load marketing events');
      toast({
        title: 'Error',
        description: 'Failed to load marketing events',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new event
  const addEvent = async (event: Omit<MarketingEvent, 'id'>) => {
    try {
      setIsLoading(true);
      
      // Format the date before sending to Supabase
      const formattedEvent = {
        ...event,
        date: formatDateToYYYYMMDD(event.date instanceof Date ? event.date : new Date(event.date)),
      };
      
      const { data, error } = await supabase
        .from('marketing_events')
        .insert(formattedEvent)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Add the new event to the state
      setEvents(prev => [...prev, { ...data, date: new Date(data.date) }]);
      
      toast({
        title: 'Success',
        description: 'Event added successfully',
      });
      
      return data;
    } catch (err) {
      console.error('Error adding marketing event:', err);
      toast({
        title: 'Error',
        description: 'Failed to add event',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Update an existing event
  const updateEvent = async (id: string, updates: Partial<Omit<MarketingEvent, 'id'>>) => {
    try {
      setIsLoading(true);
      
      // Format the date if it's being updated
      const formattedUpdates = {
        ...updates,
        ...(updates.date && { 
          date: formatDateToYYYYMMDD(updates.date instanceof Date ? updates.date : new Date(updates.date))
        }),
      };
      
      const { data, error } = await supabase
        .from('marketing_events')
        .update(formattedUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Update the event in the state
      setEvents(prev => prev.map(event => 
        event.id === id ? { ...data, date: new Date(data.date) } : event
      ));
      
      toast({
        title: 'Success',
        description: 'Event updated successfully',
      });
      
      return data;
    } catch (err) {
      console.error('Error updating marketing event:', err);
      toast({
        title: 'Error',
        description: 'Failed to update event',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete an event
  const deleteEvent = async (id: string) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('marketing_events')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Remove the event from the state
      setEvents(prev => prev.filter(event => event.id !== id));
      
      toast({
        title: 'Success',
        description: 'Event deleted successfully',
      });
      
      return true;
    } catch (err) {
      console.error('Error deleting marketing event:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    isLoading,
    error,
    fetchEvents,
    addEvent,
    updateEvent,
    deleteEvent
  };
}
