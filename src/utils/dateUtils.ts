
/**
 * Utility functions for date formatting and comparison
 */

// Format a date to YYYY-MM-DD string format for consistent comparison
export const formatDateToYYYYMMDD = (date: Date): string => {
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
};

// Compare two dates (ignoring time) to check if they are the same day
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return formatDateToYYYYMMDD(date1) === formatDateToYYYYMMDD(date2);
};
