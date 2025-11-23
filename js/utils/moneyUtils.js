/**
 * Money Utility Functions
 * Daily Budget Tracker
 *
 * Provides currency formatting, parsing, and validation utilities
 * with proper error handling and edge case management.
 */

/**
 * Format a number as currency ($X.XX)
 * @param {number|string} amount - The amount to format
 * @returns {string} Formatted currency string (e.g., "$123.45")
 */
export function formatMoney(amount) {
  // Handle null/undefined
  if (amount == null) {
    return '$0.00';
  }

  // Convert to number if string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Validate number
  if (typeof numAmount !== 'number' || isNaN(numAmount)) {
    console.warn('formatMoney: Invalid amount provided', amount);
    return '$0.00';
  }

  // Handle infinity
  if (!isFinite(numAmount)) {
    console.warn('formatMoney: Infinite value provided', amount);
    return '$0.00';
  }

  // Format as currency
  const formatted = Math.abs(numAmount).toFixed(2);

  // Add thousands separators
  const parts = formatted.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // Add dollar sign and handle negative
  const sign = numAmount < 0 ? '-' : '';
  return `${sign}$${parts.join('.')}`;
}

/**
 * Parse a currency string to a number
 * @param {string} moneyString - The currency string to parse (e.g., "$123.45" or "123.45")
 * @returns {number} Parsed number value, or 0 if invalid
 */
export function parseMoney(moneyString) {
  // Handle null/undefined
  if (moneyString == null) {
    return 0;
  }

  // Convert to string if needed
  const str = String(moneyString);

  // Remove currency symbols, commas, and whitespace
  const cleaned = str
    .replace(/[$,\s]/g, '')
    .trim();

  // Handle empty string
  if (cleaned === '') {
    return 0;
  }

  // Parse to float
  const parsed = parseFloat(cleaned);

  // Validate result
  if (isNaN(parsed) || !isFinite(parsed)) {
    console.warn('parseMoney: Invalid money string provided', moneyString);
    return 0;
  }

  // Round to 2 decimal places to avoid floating point issues
  return Math.round(parsed * 100) / 100;
}

/**
 * Validate that an amount is a positive number
 * @param {number|string} amount - The amount to validate
 * @returns {boolean} True if amount is a valid positive number
 */
export function validateAmount(amount) {
  // Handle null/undefined
  if (amount == null) {
    return false;
  }

  // Convert to number if string
  let numAmount;
  if (typeof amount === 'string') {
    numAmount = parseMoney(amount);
  } else {
    numAmount = amount;
  }

  // Check if valid number
  if (typeof numAmount !== 'number' || isNaN(numAmount) || !isFinite(numAmount)) {
    return false;
  }

  // Check if positive (allow zero)
  if (numAmount < 0) {
    return false;
  }

  return true;
}

/**
 * Add two money amounts safely (avoiding floating point errors)
 * @param {number} amount1 - First amount
 * @param {number} amount2 - Second amount
 * @returns {number} Sum rounded to 2 decimal places
 */
export function addMoney(amount1, amount2) {
  const a1 = typeof amount1 === 'number' ? amount1 : 0;
  const a2 = typeof amount2 === 'number' ? amount2 : 0;

  return Math.round((a1 + a2) * 100) / 100;
}

/**
 * Subtract two money amounts safely (avoiding floating point errors)
 * @param {number} amount1 - Amount to subtract from
 * @param {number} amount2 - Amount to subtract
 * @returns {number} Difference rounded to 2 decimal places
 */
export function subtractMoney(amount1, amount2) {
  const a1 = typeof amount1 === 'number' ? amount1 : 0;
  const a2 = typeof amount2 === 'number' ? amount2 : 0;

  return Math.round((a1 - a2) * 100) / 100;
}

/**
 * Multiply a money amount safely (avoiding floating point errors)
 * @param {number} amount - The amount
 * @param {number} multiplier - The multiplier
 * @returns {number} Product rounded to 2 decimal places
 */
export function multiplyMoney(amount, multiplier) {
  const a = typeof amount === 'number' ? amount : 0;
  const m = typeof multiplier === 'number' ? multiplier : 0;

  return Math.round((a * m) * 100) / 100;
}
