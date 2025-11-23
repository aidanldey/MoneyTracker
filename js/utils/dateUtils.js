/**
 * Date Utility Functions
 * Daily Budget Tracker
 *
 * Provides date manipulation and formatting utilities
 * with proper error handling and edge case management.
 */

/**
 * Get today's date at midnight (00:00:00)
 * @returns {Date} Today's date with time set to midnight
 */
export function getToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Calculate the number of days from today to a target date
 * @param {Date|string|number} targetDate - The target date
 * @returns {number} Number of days until target (negative if in past, 0 if today)
 */
export function getDaysUntil(targetDate) {
  // Handle null/undefined
  if (targetDate == null) {
    return 0;
  }

  // Convert to Date object if needed
  const target = new Date(targetDate);

  // Validate date
  if (isNaN(target.getTime())) {
    console.warn('getDaysUntil: Invalid date provided', targetDate);
    return 0;
  }

  // Set target to midnight for accurate day calculation
  target.setHours(0, 0, 0, 0);

  // Get today at midnight
  const today = getToday();

  // Calculate difference in milliseconds and convert to days
  const diffInMs = target.getTime() - today.getTime();
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

  return diffInDays;
}

/**
 * Add a specified number of days to a date
 * @param {Date|string|number} date - The starting date
 * @param {number} days - Number of days to add (can be negative)
 * @returns {Date} New date with days added
 */
export function addDays(date, days) {
  // Handle null/undefined date
  if (date == null) {
    date = new Date();
  }

  // Convert to Date object
  const result = new Date(date);

  // Validate date
  if (isNaN(result.getTime())) {
    console.warn('addDays: Invalid date provided', date);
    return new Date();
  }

  // Validate days parameter
  const daysToAdd = typeof days === 'number' && !isNaN(days) ? days : 0;

  // Add days
  result.setDate(result.getDate() + daysToAdd);

  return result;
}

/**
 * Format a date as a readable string
 * @param {Date|string|number} date - The date to format
 * @param {string} format - Format type: 'short', 'long', 'iso', or custom
 * @returns {string} Formatted date string
 */
export function formatDate(date, format = 'short') {
  // Handle null/undefined
  if (date == null) {
    return '';
  }

  // Convert to Date object
  const dateObj = new Date(date);

  // Validate date
  if (isNaN(dateObj.getTime())) {
    console.warn('formatDate: Invalid date provided', date);
    return '';
  }

  // Format based on type
  switch (format) {
    case 'short':
      // MM/DD/YYYY
      return `${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}/${dateObj.getFullYear()}`;

    case 'long':
      // Month DD, YYYY (e.g., "January 15, 2025")
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

    case 'iso':
      // YYYY-MM-DD
      return dateObj.toISOString().split('T')[0];

    case 'relative':
      // "Today", "Tomorrow", "Yesterday", or date
      const today = getToday();
      const daysUntil = getDaysUntil(dateObj);

      if (daysUntil === 0) return 'Today';
      if (daysUntil === 1) return 'Tomorrow';
      if (daysUntil === -1) return 'Yesterday';

      return formatDate(dateObj, 'short');

    default:
      // Default to short format
      return formatDate(dateObj, 'short');
  }
}

/**
 * Check if a date is today
 * @param {Date|string|number} date - The date to check
 * @returns {boolean} True if the date is today
 */
export function isToday(date) {
  // Handle null/undefined
  if (date == null) {
    return false;
  }

  // Convert to Date object
  const dateObj = new Date(date);

  // Validate date
  if (isNaN(dateObj.getTime())) {
    return false;
  }

  // Get today at midnight
  const today = getToday();

  // Set comparison date to midnight
  dateObj.setHours(0, 0, 0, 0);

  // Compare timestamps
  return dateObj.getTime() === today.getTime();
}
