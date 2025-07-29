/**
 * Timezone utility functions
 * Centralized management of timezone-related operations for better maintainability
 */

// Default timezone configuration - can be overridden by environment variables
const DEFAULT_TIMEZONE = 'Asia/Taipei';

/**
 * Get the user's local timezone using browser API
 * @returns User's timezone string (e.g., "America/New_York", "Asia/Tokyo")
 */
export const getUserTimezone = (): string => {
  if (typeof window !== 'undefined' && Intl?.DateTimeFormat) {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      console.warn('Failed to detect user timezone:', error);
    }
  }
  return DEFAULT_TIMEZONE;
};

/**
 * Get the configured timezone for the application
 * Priority: Environment variable > User's local timezone > Default
 * 
 * @param preferUserTimezone - If true, prioritizes user's local timezone over config
 */
export const getAppTimezone = (preferUserTimezone: boolean = true): string => {
  // Check environment variables first
  const envTimezone = typeof window !== 'undefined' 
    ? process.env.NEXT_PUBLIC_TIMEZONE 
    : (process.env.TIMEZONE || process.env.NEXT_PUBLIC_TIMEZONE);
  
  if (envTimezone) {
    return envTimezone;
  }
  
  // If preferring user timezone and on client-side
  if (preferUserTimezone && typeof window !== 'undefined') {
    const userTimezone = getUserTimezone();
    if (userTimezone !== DEFAULT_TIMEZONE) {
      return userTimezone;
    }
  }
  
  return DEFAULT_TIMEZONE;
};

/**
 * Check if a datetime string has expired in the specified timezone
 * 
 * This function replaces complex timezone conversion logic with a simpler approach:
 * - Converts both dates to the same timezone
 * - Performs direct comparison without multiple conversions
 * 
 * @param expiresAt - ISO datetime string representing expiration time
 * @param timezone - Optional timezone override (defaults to user's local timezone)
 * @param preferUserTimezone - If true, uses user's local timezone when no timezone specified
 * @returns true if the datetime has passed, false otherwise
 */
export const isExpired = (
  expiresAt: string, 
  timezone?: string, 
  preferUserTimezone: boolean = true
): boolean => {
  try {
    const targetTimezone = timezone || getAppTimezone(preferUserTimezone);
    
    // Create date objects in the target timezone
    const now = new Date();
    const expiry = new Date(expiresAt);
    
    // Convert both to the target timezone for accurate comparison
    const nowInTimezone = new Date(now.toLocaleString('en-US', { timeZone: targetTimezone }));
    const expiryInTimezone = new Date(expiry.toLocaleString('en-US', { timeZone: targetTimezone }));
    
    return nowInTimezone > expiryInTimezone;
  } catch (error) {
    console.warn('Error checking expiration:', error);
    // Fail-safe: treat as expired if we can't determine
    return true;
  }
};

/**
 * Simple wrapper function for backward compatibility
 * Uses user's local timezone by default
 */
export const checkExpiry = (expiresAt: string): boolean => {
  return isExpired(expiresAt, undefined, true);
};
