/**
 * Cache and expiration time configurations
 * Centralized management of cache durations for better maintainability
 */

// Application timezone configuration
export const APP_CONFIG = {
  // Default timezone - can be overridden by environment variables
  DEFAULT_TIMEZONE: 'Asia/Taipei',
} as const;

// Duration constants in milliseconds
export const CACHE_DURATIONS = {
  // Invite link expiration (30 days)
  INVITE_LINK_EXPIRES_MS: 30 * 24 * 60 * 60 * 1000,
  
  // JWT token expiration (7 days)  
  JWT_EXPIRES_DAYS: 7,
  
  // Folder data cache duration (5 minutes)
  FOLDER_CACHE_MS: 5 * 60 * 1000,
} as const;

// Helper functions for common operations
export const getCacheConfig = () => ({
  /**
   * Calculate invite link expiration date
   * @param baseDate - Base date for calculation (defaults to current date)
   * @returns Date object representing expiration time
   */
  inviteLinkExpiresAt: (baseDate: Date = new Date()) => 
    new Date(baseDate.getTime() + CACHE_DURATIONS.INVITE_LINK_EXPIRES_MS),
  
  /**
   * JWT token expiration string for jsonwebtoken library
   * @returns String in format like "7d"
   */
  jwtExpiresIn: `${CACHE_DURATIONS.JWT_EXPIRES_DAYS}d` as const,
  
  /**
   * Folder data cache duration in milliseconds
   * @returns Cache duration for folder data
   */
  folderCacheDuration: CACHE_DURATIONS.FOLDER_CACHE_MS,
});

// Type definitions
export type CacheDurations = typeof CACHE_DURATIONS;
export type CacheConfig = ReturnType<typeof getCacheConfig>;