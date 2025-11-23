/**
 * LocalStorage Utility Functions
 * Daily Budget Tracker
 *
 * Provides localStorage wrapper functions with JSON serialization,
 * error handling, and availability checking.
 */

// App-specific storage key prefix to avoid conflicts
const STORAGE_PREFIX = 'budgetTracker_';

/**
 * Check if localStorage is available and accessible
 * @returns {boolean} True if localStorage is available
 */
export function storageAvailable() {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.warn('localStorage is not available:', error.message);
    return false;
  }
}

/**
 * Save data to localStorage with JSON serialization
 * @param {string} key - The storage key (will be prefixed automatically)
 * @param {*} data - The data to store (will be JSON stringified)
 * @returns {boolean} True if save was successful
 */
export function saveToStorage(key, data) {
  // Validate key
  if (typeof key !== 'string' || key.trim() === '') {
    console.error('saveToStorage: Invalid key provided', key);
    return false;
  }

  // Check if storage is available
  if (!storageAvailable()) {
    console.error('saveToStorage: localStorage is not available');
    return false;
  }

  try {
    // Serialize data to JSON
    const serialized = JSON.stringify(data);

    // Save to localStorage with prefix
    const prefixedKey = STORAGE_PREFIX + key;
    localStorage.setItem(prefixedKey, serialized);

    return true;
  } catch (error) {
    console.error('saveToStorage: Failed to save data', {
      key,
      error: error.message
    });
    return false;
  }
}

/**
 * Load data from localStorage with JSON parsing
 * @param {string} key - The storage key (will be prefixed automatically)
 * @returns {*} The parsed data, or null if not found or error occurred
 */
export function loadFromStorage(key) {
  // Validate key
  if (typeof key !== 'string' || key.trim() === '') {
    console.error('loadFromStorage: Invalid key provided', key);
    return null;
  }

  // Check if storage is available
  if (!storageAvailable()) {
    console.error('loadFromStorage: localStorage is not available');
    return null;
  }

  try {
    // Retrieve from localStorage with prefix
    const prefixedKey = STORAGE_PREFIX + key;
    const serialized = localStorage.getItem(prefixedKey);

    // Return null if key doesn't exist
    if (serialized === null) {
      return null;
    }

    // Parse and return data
    const data = JSON.parse(serialized);
    return data;
  } catch (error) {
    console.error('loadFromStorage: Failed to load data', {
      key,
      error: error.message
    });
    return null;
  }
}

/**
 * Remove a specific item from localStorage
 * @param {string} key - The storage key to remove (will be prefixed automatically)
 * @returns {boolean} True if removal was successful
 */
export function removeFromStorage(key) {
  // Validate key
  if (typeof key !== 'string' || key.trim() === '') {
    console.error('removeFromStorage: Invalid key provided', key);
    return false;
  }

  // Check if storage is available
  if (!storageAvailable()) {
    console.error('removeFromStorage: localStorage is not available');
    return false;
  }

  try {
    const prefixedKey = STORAGE_PREFIX + key;
    localStorage.removeItem(prefixedKey);
    return true;
  } catch (error) {
    console.error('removeFromStorage: Failed to remove data', {
      key,
      error: error.message
    });
    return false;
  }
}

/**
 * Clear all app data from localStorage
 * Only removes items with the app prefix to avoid clearing other apps' data
 * @returns {boolean} True if clear was successful
 */
export function clearStorage() {
  // Check if storage is available
  if (!storageAvailable()) {
    console.error('clearStorage: localStorage is not available');
    return false;
  }

  try {
    // Get all keys from localStorage
    const keys = Object.keys(localStorage);

    // Remove only keys with our prefix
    let removedCount = 0;
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
        removedCount++;
      }
    });

    console.log(`clearStorage: Removed ${removedCount} items`);
    return true;
  } catch (error) {
    console.error('clearStorage: Failed to clear storage', error.message);
    return false;
  }
}

/**
 * Get all app storage keys (without prefix)
 * @returns {string[]} Array of storage keys used by the app
 */
export function getStorageKeys() {
  if (!storageAvailable()) {
    return [];
  }

  try {
    const keys = Object.keys(localStorage);
    return keys
      .filter(key => key.startsWith(STORAGE_PREFIX))
      .map(key => key.substring(STORAGE_PREFIX.length));
  } catch (error) {
    console.error('getStorageKeys: Failed to get keys', error.message);
    return [];
  }
}

/**
 * Check if a key exists in storage
 * @param {string} key - The storage key to check (will be prefixed automatically)
 * @returns {boolean} True if the key exists
 */
export function hasKey(key) {
  if (!storageAvailable()) {
    return false;
  }

  const prefixedKey = STORAGE_PREFIX + key;
  return localStorage.getItem(prefixedKey) !== null;
}
