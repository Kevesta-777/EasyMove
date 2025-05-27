import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as a price with the appropriate currency symbol and decimal places
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Calculate VAT amount (20%) from a price that includes VAT
 */
export function calculateVATFromGross(grossPrice: number): number {
  // UK VAT calculation: VAT is 20% of the net price
  // If price includes VAT: VAT = gross * 0.2 / 1.2 (or gross * 1/6)
  return grossPrice * (1/6);
}

/**
 * Calculate price excluding VAT from a price that includes VAT
 */
export function calculateNetFromGross(grossPrice: number): number {
  // Net price = Gross price - VAT amount
  // Net price = Gross price - (Gross price * 1/6)
  // Net price = Gross price * (5/6)
  return grossPrice * (5/6);
}

/**
 * Format a date consistently across the application
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format a time consistently across the application
 */
export function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a date and time consistently across the application
 */
export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} at ${formatTime(date)}`;
}
