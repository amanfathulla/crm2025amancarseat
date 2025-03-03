
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MarketingTask } from '@/types/marketing';
import { useToast } from '@/hooks/use-toast';
import { formatDateToYYYYMMDD } from '@/utils/dateUtils';

export function useMarketingTasks() {
  const [tasks, setTasks] = useState<MarketingTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch tasks from Supabase
  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('marketing_tasks')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      // Convert and ensure type safety
      const formattedTasks = data.map(task => ({
        id: task.id,
        title: task.title,
        dueDate: task.due_date,
        completed: task.completed,
        // Ensure the type is one of the allowed values
        type: isValidTaskType(task.type) ? task.type : 'general'
      })) as MarketingTask[];
      
      setTasks(formattedTasks);
    } catch (err) {
      console.error('Error fetching marketing tasks:', err);
      setError('Failed to load marketing tasks');
      toast({
        title: 'Error',
        description: 'Failed to load marketing tasks',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to validate task type
  const isValidTaskType = (type: string): type is MarketingTask['type'] => {
    return ['facebook', 'instagram', 'tiktok', 'general'].includes(type);
  };

  // Add a new task
  const addTask = async (task: Omit<MarketingTask, 'id'>) => {
    try {
      setIsLoading(true);
      
      // Format the data for Supabase
      const formattedTask = {
        title: task.title,
        due_date: task.dueDate,
        completed: task.completed,
        type: task.type,
      };
      
      const { data, error } = await supabase
        .from('marketing_tasks')
        .insert(formattedTask)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Add the new task to the state with proper type validation
      const newTask: MarketingTask = {
        id: data.id,
        title: data.title,
        dueDate: data.due_date,
        completed: data.completed,
        type: isValidTaskType(data.type) ? data.type : 'general'
      };
      
      setTasks(prev => [...prev, newTask]);
      
      toast({
        title: 'Success',
        description: 'Task added successfully',
      });
      
      return data;
    } catch (err) {
      console.error('Error adding marketing task:', err);
      toast({
        title: 'Error',
        description: 'Failed to add task',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Update an existing task
  const updateTask = async (id: string, updates: Partial<Omit<MarketingTask, 'id'>>) => {
    try {
      setIsLoading(true);
      
      // Format the data for Supabase
      const formattedUpdates: any = {};
      
      if (updates.title !== undefined) formattedUpdates.title = updates.title;
      if (updates.completed !== undefined) formattedUpdates.completed = updates.completed;
      if (updates.type !== undefined) formattedUpdates.type = updates.type;
      if (updates.dueDate !== undefined) formattedUpdates.due_date = updates.dueDate;
      
      const { data, error } = await supabase
        .from('marketing_tasks')
        .update(formattedUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Update the task in the state with proper type validation
      const updatedTask: MarketingTask = {
        id: data.id,
        title: data.title,
        dueDate: data.due_date,
        completed: data.completed,
        type: isValidTaskType(data.type) ? data.type : 'general'
      };
      
      setTasks(prev => prev.map(task => 
        task.id === id ? updatedTask : task
      ));
      
      toast({
        title: 'Success',
        description: 'Task updated successfully',
      });
      
      return data;
    } catch (err) {
      console.error('Error updating marketing task:', err);
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a task
  const deleteTask = async (id: string) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('marketing_tasks')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Remove the task from the state
      setTasks(prev => prev.filter(task => task.id !== id));
      
      toast({
        title: 'Success',
        description: 'Task deleted successfully',
      });
      
      return true;
    } catch (err) {
      console.error('Error deleting marketing task:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle task completion status
  const toggleTaskCompletion = async (id: string, completed: boolean) => {
    return updateTask(id, { completed });
  };

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  return {
    tasks,
    isLoading,
    error,
    fetchTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion
  };
}
