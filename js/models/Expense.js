/**
 * Expense Model
 * Daily Budget Tracker
 *
 * Defines expense structure, categories, and validation.
 */

import { getToday } from '../utils/dateUtils.js';

/**
 * Expense category types
 */
export const EXPENSE_CATEGORIES = {
  FOOD: 'food',
  TRANSPORTATION: 'transportation',
  UTILITIES: 'utilities',
  HOUSING: 'housing',
  ENTERTAINMENT: 'entertainment',
  MEDICAL: 'medical',
  DEBT: 'debt',
  OTHER: 'other'
};

/**
 * Category labels for display
 */
export const CATEGORY_LABELS = {
  [EXPENSE_CATEGORIES.FOOD]: 'Food',
  [EXPENSE_CATEGORIES.TRANSPORTATION]: 'Transportation',
  [EXPENSE_CATEGORIES.UTILITIES]: 'Utilities',
  [EXPENSE_CATEGORIES.HOUSING]: 'Housing',
  [EXPENSE_CATEGORIES.ENTERTAINMENT]: 'Entertainment',
  [EXPENSE_CATEGORIES.MEDICAL]: 'Medical',
  [EXPENSE_CATEGORIES.DEBT]: 'Debt',
  [EXPENSE_CATEGORIES.OTHER]: 'Other'
};

/**
 * Expense class for creating and validating expense objects
 */
export class Expense {
  /**
   * Create a new expense object
   * @param {number} amount - Expense amount
   * @param {string} description - Expense description
   * @param {Object} options - Optional parameters
   * @param {string} options.categoryType - Category type (optional)
   * @param {string} options.customName - Custom category name (optional)
   * @param {string|Date} options.date - Expense date (defaults to today)
   * @returns {Object} Expense object
   */
  static create(amount, description, options = {}) {
    const expense = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      amount,
      description: description || 'Expense',
      date: options.date ? new Date(options.date).toISOString() : getToday().toISOString(),
      timestamp: Date.now()
    };

    // Add category if provided
    if (options.categoryType) {
      expense.category = {
        type: options.categoryType,
        customName: options.customName || null
      };
    }

    return expense;
  }

  /**
   * Validate expense data
   * @param {Object} expense - Expense object to validate
   * @returns {Object} Validation result {valid: boolean, error: string}
   */
  static validate(expense) {
    if (!expense.amount || expense.amount <= 0) {
      return { valid: false, error: 'Amount must be greater than $0' };
    }

    if (expense.category) {
      const validCategories = Object.values(EXPENSE_CATEGORIES);
      if (!validCategories.includes(expense.category.type)) {
        return { valid: false, error: 'Invalid category type' };
      }

      // Custom name validation (if provided)
      if (expense.category.customName && expense.category.customName.length > 100) {
        return { valid: false, error: 'Custom name must be 100 characters or less' };
      }
    }

    return { valid: true };
  }

  /**
   * Get category label for display
   * @param {Object} expense - Expense object
   * @returns {string|null} Category label or null if no category
   */
  static getCategoryLabel(expense) {
    if (!expense.category) {
      return null;
    }

    // Use custom name if provided, otherwise use category label
    if (expense.category.customName) {
      return expense.category.customName;
    }

    return CATEGORY_LABELS[expense.category.type] || null;
  }

  /**
   * Get category type label (without custom name)
   * @param {string} categoryType - Category type
   * @returns {string} Category label
   */
  static getCategoryTypeLabel(categoryType) {
    return CATEGORY_LABELS[categoryType] || categoryType;
  }

  /**
   * Check if expense has a category
   * @param {Object} expense - Expense object
   * @returns {boolean} True if expense has a category
   */
  static hasCategory(expense) {
    return Boolean(expense.category && expense.category.type);
  }

  /**
   * Get all available categories
   * @returns {Array<Object>} Array of {value, label} objects
   */
  static getAvailableCategories() {
    return Object.values(EXPENSE_CATEGORIES).map(type => ({
      value: type,
      label: CATEGORY_LABELS[type]
    }));
  }

  /**
   * Format expense for display
   * @param {Object} expense - Expense object
   * @returns {Object} Formatted expense with display properties
   */
  static format(expense) {
    return {
      ...expense,
      categoryLabel: this.getCategoryLabel(expense),
      hasCategory: this.hasCategory(expense)
    };
  }
}

export default Expense;
