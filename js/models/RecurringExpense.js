/**
 * Recurring Expense Model
 * Daily Budget Tracker
 *
 * Handles recurring expense calculations, scheduling, and deductions.
 * Supports Daily, Weekly, Bi-Weekly, Monthly, and Yearly frequencies.
 */

import { getToday, addDays, getDaysUntil } from '../utils/dateUtils.js';

/**
 * RecurringExpense class for calculating expense occurrences
 */
export class RecurringExpense {
  /**
   * Calculate the number of occurrences within a date range
   * @param {string} frequency - daily, weekly, bi-weekly, monthly, yearly
   * @param {Date|string} startDate - Start date of the expense
   * @param {Date|string} rangeStart - Start of the range to calculate
   * @param {Date|string} rangeEnd - End of the range to calculate
   * @param {Date|string|null} endDate - Optional end date for the recurring expense
   * @returns {number} Number of occurrences in the range
   */
  static calculateOccurrences(frequency, startDate, rangeStart, rangeEnd, endDate = null) {
    const start = new Date(startDate);
    const rStart = new Date(rangeStart);
    const rEnd = new Date(rangeEnd);
    const end = endDate ? new Date(endDate) : null;

    // Normalize dates to midnight
    start.setHours(0, 0, 0, 0);
    rStart.setHours(0, 0, 0, 0);
    rEnd.setHours(0, 0, 0, 0);
    if (end) end.setHours(0, 0, 0, 0);

    // If start date is after range end, no occurrences
    if (start > rEnd) {
      return 0;
    }

    // If end date exists and is before range start, no occurrences
    if (end && end < rStart) {
      return 0;
    }

    let occurrences = 0;
    let currentDate = new Date(start);

    // Calculate based on frequency
    while (currentDate <= rEnd) {
      // Check if within range and before end date (if exists)
      if (currentDate >= rStart && currentDate <= rEnd) {
        if (!end || currentDate <= end) {
          occurrences++;
        }
      }

      // Move to next occurrence
      currentDate = this.getNextOccurrence(currentDate, frequency);

      // Safety check to prevent infinite loops
      if (occurrences > 10000) {
        console.error('calculateOccurrences: Too many iterations, breaking');
        break;
      }
    }

    return occurrences;
  }

  /**
   * Calculate the next occurrence date based on frequency
   * @param {Date} currentDate - Current occurrence date
   * @param {string} frequency - daily, weekly, bi-weekly, monthly, yearly
   * @returns {Date} Next occurrence date
   */
  static getNextOccurrence(currentDate, frequency) {
    const next = new Date(currentDate);

    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;

      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;

      case 'bi-weekly':
        next.setDate(next.getDate() + 14);
        break;

      case 'monthly':
        const originalDay = currentDate.getDate();
        next.setMonth(next.getMonth() + 1);
        // Handle month-end edge cases (e.g., Jan 31 -> Feb 28)
        if (next.getDate() !== originalDay) {
          next.setDate(0); // Go to last day of previous month
        }
        break;

      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        // Handle leap year edge case (Feb 29)
        if (next.getMonth() !== currentDate.getMonth()) {
          next.setDate(0); // Go to Feb 28
        }
        break;

      default:
        // Default to monthly
        next.setMonth(next.getMonth() + 1);
    }

    return next;
  }

  /**
   * Calculate total deduction amount for recurring expenses in a date range
   * @param {Array<Object>} recurringExpenses - Array of recurring expense objects
   * @param {Date|string} rangeStart - Start of the range
   * @param {Date|string} rangeEnd - End of the range
   * @returns {number} Total deduction amount
   */
  static calculateTotalDeduction(recurringExpenses, rangeStart, rangeEnd) {
    let total = 0;

    for (const expense of recurringExpenses) {
      const occurrences = this.calculateOccurrences(
        expense.frequency,
        expense.startDate,
        rangeStart,
        rangeEnd,
        expense.endDate
      );

      total += expense.amount * occurrences;
    }

    return total;
  }

  /**
   * Generate schedule of all occurrences for a recurring expense
   * @param {Object} expense - Recurring expense object
   * @param {Date|string} rangeStart - Start of the range
   * @param {Date|string} rangeEnd - End of the range
   * @param {number} maxOccurrences - Maximum number of occurrences to return (default 100)
   * @returns {Array<Object>} Array of scheduled occurrences
   */
  static generateSchedule(expense, rangeStart, rangeEnd, maxOccurrences = 100) {
    const schedule = [];
    const start = new Date(expense.startDate);
    const rStart = new Date(rangeStart);
    const rEnd = new Date(rangeEnd);
    const end = expense.endDate ? new Date(expense.endDate) : null;

    // Normalize dates to midnight
    start.setHours(0, 0, 0, 0);
    rStart.setHours(0, 0, 0, 0);
    rEnd.setHours(0, 0, 0, 0);
    if (end) end.setHours(0, 0, 0, 0);

    let currentDate = new Date(start);
    let count = 0;

    while (currentDate <= rEnd && count < maxOccurrences) {
      // Check if within range and before end date (if exists)
      if (currentDate >= rStart && currentDate <= rEnd) {
        if (!end || currentDate <= end) {
          schedule.push({
            id: `${expense.id}-${count}`,
            expenseId: expense.id,
            description: expense.description,
            amount: expense.amount,
            category: expense.category,
            date: new Date(currentDate).toISOString(),
            frequency: expense.frequency,
            isRecurring: true
          });
          count++;
        }
      }

      // Move to next occurrence
      currentDate = this.getNextOccurrence(currentDate, expense.frequency);
    }

    return schedule;
  }

  /**
   * Get user-friendly frequency label
   * @param {string} frequency - Frequency value
   * @returns {string} Formatted frequency label
   */
  static getFrequencyLabel(frequency) {
    const labels = {
      'daily': 'Daily',
      'weekly': 'Weekly',
      'bi-weekly': 'Bi-Weekly',
      'monthly': 'Monthly',
      'yearly': 'Yearly'
    };

    return labels[frequency] || frequency;
  }

  /**
   * Validate recurring expense data
   * @param {Object} expense - Recurring expense object
   * @returns {Object} Validation result {valid: boolean, error: string}
   */
  static validate(expense) {
    if (!expense.amount || expense.amount <= 0) {
      return { valid: false, error: 'Amount must be greater than $0' };
    }

    if (!expense.frequency) {
      return { valid: false, error: 'Frequency is required' };
    }

    const validFrequencies = ['daily', 'weekly', 'bi-weekly', 'monthly', 'yearly'];
    if (!validFrequencies.includes(expense.frequency)) {
      return { valid: false, error: 'Invalid frequency' };
    }

    if (!expense.startDate) {
      return { valid: false, error: 'Start date is required' };
    }

    // If end date exists, validate it's after start date
    if (expense.endDate) {
      const start = new Date(expense.startDate);
      const end = new Date(expense.endDate);

      if (end < start) {
        return { valid: false, error: 'End date must be after start date' };
      }
    }

    return { valid: true };
  }

  /**
   * Check if a recurring expense is active on a given date
   * @param {Object} expense - Recurring expense object
   * @param {Date|string} date - Date to check
   * @returns {boolean} True if active on the date
   */
  static isActiveOn(expense, date) {
    const checkDate = new Date(date);
    const start = new Date(expense.startDate);
    const end = expense.endDate ? new Date(expense.endDate) : null;

    checkDate.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    if (end) end.setHours(0, 0, 0, 0);

    // Check if date is within range
    if (checkDate < start) {
      return false;
    }

    if (end && checkDate > end) {
      return false;
    }

    return true;
  }

  /**
   * Get the next scheduled occurrence for a recurring expense after a given date
   * @param {Object} expense - Recurring expense object
   * @param {Date|string} afterDate - Date after which to find the next occurrence
   * @returns {Date|null} Next occurrence date or null if none
   */
  static getNextScheduledOccurrence(expense, afterDate = getToday()) {
    const after = new Date(afterDate);
    const start = new Date(expense.startDate);
    const end = expense.endDate ? new Date(expense.endDate) : null;

    after.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    if (end) end.setHours(0, 0, 0, 0);

    // If expense hasn't started yet, return start date
    if (start > after) {
      return start;
    }

    // If expense has ended, return null
    if (end && after > end) {
      return null;
    }

    // Find next occurrence
    let currentDate = new Date(start);
    let iterations = 0;
    const maxIterations = 10000;

    while (currentDate <= after && iterations < maxIterations) {
      currentDate = this.getNextOccurrence(currentDate, expense.frequency);
      iterations++;
    }

    // Check if next occurrence is after end date
    if (end && currentDate > end) {
      return null;
    }

    return currentDate;
  }
}

export default RecurringExpense;
