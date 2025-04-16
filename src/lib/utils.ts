
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return `RM ${amount.toFixed(2)}`;
}

/**
 * Formats a date object or string to a localized date string
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

/**
 * Compares two dates for sorting (handles null/undefined dates)
 */
export function compareDates(dateA: string | null | undefined, dateB: string | null | undefined, ascending = false): number {
  // If both dates are null/undefined, they're equal
  if ((!dateA || dateA === "") && (!dateB || dateB === "")) return 0;
  
  // Null/undefined dates are always considered "less than" actual dates
  if (!dateA || dateA === "") return ascending ? -1 : 1;
  if (!dateB || dateB === "") return ascending ? 1 : -1;
  
  // Convert to Date objects and compare
  const a = new Date(dateA);
  const b = new Date(dateB);
  
  return ascending ? a.getTime() - b.getTime() : b.getTime() - a.getTime();
}
