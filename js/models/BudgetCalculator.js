/**
 * Budget Calculator
 * Daily Budget Tracker
 *
 * Core business logic for calculating daily budgets, tracking spending,
 * and determining budget status levels.
 */

import { subtractMoney } from '../utils/moneyUtils.js';

/**
 * BudgetCalculator class handles all budget-related calculations
 *
 * @example
 * const calculator = new BudgetCalculator();
 * const dailyBudget = calculator.calculateDailyBudget(100, 5); // $20.00/day
 * const remaining = calculator.calculateRemainingToday(20, 5); // $15.00
 * const status = calculator.getStatusLevel(15, 20); // 'good'
 */
export class BudgetCalculator {
  /**
   * Calculate daily budget based on current balance and days remaining
   *
   * Formula: balance / daysRemaining
   * Returns 0 if daysRemaining is 0 or if result would be negative
   *
   * @param {number} currentBalance - The current account balance
   * @param {number} daysRemaining - Number of days until payday
   * @returns {number} Daily budget amount (rounded to 2 decimal places)
   *
   * @example
   * calculateDailyBudget(100, 5)  // returns 20.00
   * calculateDailyBudget(100, 1)  // returns 100.00
   * calculateDailyBudget(100, 0)  // returns 0.00
   * calculateDailyBudget(-50, 5)  // returns 0.00 (negative balance)
   */
  calculateDailyBudget(currentBalance, daysRemaining) {
    // Validate inputs
    if (typeof currentBalance !== 'number' || typeof daysRemaining !== 'number') {
      console.warn('calculateDailyBudget: Invalid input types', {
        currentBalance,
        daysRemaining
      });
      return 0;
    }

    // Handle edge case: no days remaining
    if (daysRemaining <= 0) {
      return 0;
    }

    // Handle edge case: negative balance
    if (currentBalance < 0) {
      return 0;
    }

    // Calculate daily budget
    const dailyBudget = currentBalance / daysRemaining;

    // Round to 2 decimal places to avoid floating point issues
    return Math.round(dailyBudget * 100) / 100;
  }

  /**
   * Calculate remaining budget for today
   *
   * Formula: dailyBudget - todaySpent
   * Can return negative values if overspent
   *
   * @param {number} dailyBudget - The daily budget amount
   * @param {number} todaySpent - Amount spent today
   * @returns {number} Remaining budget for today (rounded to 2 decimal places)
   *
   * @example
   * calculateRemainingToday(20, 5)   // returns 15.00
   * calculateRemainingToday(20, 20)  // returns 0.00
   * calculateRemainingToday(20, 25)  // returns -5.00 (overspent)
   */
  calculateRemainingToday(dailyBudget, todaySpent) {
    // Validate inputs
    if (typeof dailyBudget !== 'number' || typeof todaySpent !== 'number') {
      console.warn('calculateRemainingToday: Invalid input types', {
        dailyBudget,
        todaySpent
      });
      return 0;
    }

    // Calculate remaining using safe money subtraction
    const remaining = subtractMoney(dailyBudget, todaySpent);

    return remaining;
  }

  /**
   * Determine budget status level based on remaining vs daily budget
   *
   * Status levels:
   * - 'good': remaining > 70% of daily budget
   * - 'warning': remaining between 30% and 70% of daily budget
   * - 'danger': remaining < 30% of daily budget
   *
   * @param {number} remainingToday - Amount remaining today
   * @param {number} dailyBudget - The daily budget amount
   * @returns {'good' | 'warning' | 'danger'} Status level
   *
   * @example
   * getStatusLevel(15, 20)   // returns 'good' (75%)
   * getStatusLevel(10, 20)   // returns 'warning' (50%)
   * getStatusLevel(5, 20)    // returns 'danger' (25%)
   * getStatusLevel(-5, 20)   // returns 'danger' (overspent)
   * getStatusLevel(20, 0)    // returns 'good' (edge case)
   */
  getStatusLevel(remainingToday, dailyBudget) {
    // Validate inputs
    if (typeof remainingToday !== 'number' || typeof dailyBudget !== 'number') {
      console.warn('getStatusLevel: Invalid input types', {
        remainingToday,
        dailyBudget
      });
      return 'danger';
    }

    // Edge case: no daily budget set
    if (dailyBudget === 0) {
      return remainingToday >= 0 ? 'good' : 'danger';
    }

    // Calculate percentage of daily budget remaining
    const percentageRemaining = (remainingToday / dailyBudget) * 100;

    // Determine status based on percentage thresholds
    if (percentageRemaining > 70) {
      return 'good';
    } else if (percentageRemaining >= 30) {
      return 'warning';
    } else {
      return 'danger';
    }
  }

  /**
   * Recalculate daily budget (alias for calculateDailyBudget)
   *
   * This method exists for semantic clarity when recalculating
   * after an expense has been made.
   *
   * @param {number} currentBalance - The current account balance
   * @param {number} daysRemaining - Number of days until payday
   * @returns {number} Recalculated daily budget amount
   *
   * @example
   * recalculateBudget(80, 4) // returns 20.00
   */
  recalculateBudget(currentBalance, daysRemaining) {
    return this.calculateDailyBudget(currentBalance, daysRemaining);
  }

  /**
   * Calculate new balance after subtracting an expense
   *
   * @param {number} currentBalance - The current account balance
   * @param {number} expenseAmount - The expense amount to subtract
   * @returns {number} New balance after expense (rounded to 2 decimal places)
   *
   * @example
   * subtractExpense(100, 25)  // returns 75.00
   * subtractExpense(100, 100) // returns 0.00
   * subtractExpense(100, 150) // returns -50.00 (overdraft)
   */
  subtractExpense(currentBalance, expenseAmount) {
    // Validate inputs
    if (typeof currentBalance !== 'number' || typeof expenseAmount !== 'number') {
      console.warn('subtractExpense: Invalid input types', {
        currentBalance,
        expenseAmount
      });
      return currentBalance || 0;
    }

    // Validate expense amount is not negative
    if (expenseAmount < 0) {
      console.warn('subtractExpense: Expense amount cannot be negative', {
        expenseAmount
      });
      return currentBalance;
    }

    // Subtract expense using safe money subtraction
    const newBalance = subtractMoney(currentBalance, expenseAmount);

    return newBalance;
  }

  /**
   * Calculate total spent across all expenses
   *
   * @param {Array<{amount: number}>} expenses - Array of expense objects
   * @returns {number} Total amount spent (rounded to 2 decimal places)
   *
   * @example
   * calculateTotalSpent([{amount: 10}, {amount: 5.50}]) // returns 15.50
   * calculateTotalSpent([]) // returns 0.00
   */
  calculateTotalSpent(expenses) {
    // Validate input
    if (!Array.isArray(expenses)) {
      console.warn('calculateTotalSpent: Input must be an array', expenses);
      return 0;
    }

    // Sum all expense amounts
    let total = 0;
    expenses.forEach(expense => {
      if (expense && typeof expense.amount === 'number' && expense.amount >= 0) {
        total += expense.amount;
      }
    });

    // Round to 2 decimal places
    return Math.round(total * 100) / 100;
  }

  /**
   * Check if user is on track with their budget
   *
   * Compares actual spending against expected spending for the day
   * Returns true if spending is at or below expected
   *
   * @param {number} todaySpent - Amount spent today
   * @param {number} dailyBudget - The daily budget amount
   * @returns {boolean} True if on track or under budget
   *
   * @example
   * isOnTrack(15, 20)  // returns true (under budget)
   * isOnTrack(20, 20)  // returns true (exactly on budget)
   * isOnTrack(25, 20)  // returns false (over budget)
   */
  isOnTrack(todaySpent, dailyBudget) {
    // Validate inputs
    if (typeof todaySpent !== 'number' || typeof dailyBudget !== 'number') {
      return false;
    }

    return todaySpent <= dailyBudget;
  }
}

// Export a singleton instance for convenience
export default new BudgetCalculator();
