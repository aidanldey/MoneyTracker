/**
 * Budget Store - Central State Management
 * Daily Budget Tracker
 *
 * Manages all application state, handles state updates,
 * emits change events, and persists data to localStorage.
 */

import { BudgetCalculator } from '../models/BudgetCalculator.js';
import { getToday, getDaysUntil, formatDate, addDays } from '../utils/dateUtils.js';
import { validateAmount } from '../utils/moneyUtils.js';
import { saveToStorage, loadFromStorage } from '../utils/storage.js';

/**
 * BudgetStore class - Centralized state management with event emission
 */
export class BudgetStore {
  /**
   * Initialize the store with data from localStorage or defaults
   */
  constructor() {
    // Initialize the calculator
    this.calculator = new BudgetCalculator();

    // Event listeners for state changes
    this.listeners = [];

    // Storage key for state persistence
    this.storageKey = 'budgetState';

    // Initialize state from storage or defaults
    this.state = this.loadState();
  }

  /**
   * Load state from localStorage or return default state
   * @private
   * @returns {Object} The initial state
   */
  loadState() {
    const savedState = loadFromStorage(this.storageKey);

    if (savedState) {
      // Recalculate days remaining on load
      if (savedState.budget && savedState.budget.cycleEndDate) {
        savedState.budget.daysRemaining = getDaysUntil(savedState.budget.cycleEndDate);
      }
      return savedState;
    }

    // Return default state
    return this.getDefaultState();
  }

  /**
   * Get the default initial state
   * @private
   * @returns {Object} Default state structure
   */
  getDefaultState() {
    return {
      income: {
        amount: 0,
        daysToLast: 0,
        startDate: null,
        endDate: null
      },
      budget: {
        startingBalance: 0,
        currentBalance: 0,
        dailyBudget: 0,
        todaySpent: 0,
        totalSpent: 0,
        savingsFund: 0,
        cycleStartDate: null,
        cycleEndDate: null,
        daysRemaining: 0
      },
      expenses: [],
      ui: {
        currentView: 'dashboard',
        showModal: null
      }
    };
  }

  /**
   * Get the current state (returns a deep copy for immutability)
   * @returns {Object} Deep copy of current state
   */
  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Update state with partial updates and emit change event
   * @param {Object} updates - Partial state updates (deep merged)
   */
  setState(updates) {
    // Deep merge updates into state
    this.state = this.deepMerge(this.state, updates);

    // Save to localStorage
    this.saveState();

    // Emit change event
    this.emitChange();
  }

  /**
   * Deep merge two objects
   * @private
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   */
  deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  /**
   * Set up one-time income and initialize budget cycle
   * @param {number} amount - Income amount
   * @param {number} daysToLast - Number of days until next income
   * @returns {boolean} True if setup was successful
   */
  setupIncome(amount, daysToLast) {
    // Validate inputs
    if (!validateAmount(amount)) {
      console.error('setupIncome: Invalid amount', amount);
      return false;
    }

    if (typeof daysToLast !== 'number' || daysToLast <= 0) {
      console.error('setupIncome: Invalid daysToLast', daysToLast);
      return false;
    }

    // Calculate dates
    const startDate = getToday();
    const endDate = addDays(startDate, daysToLast);

    // Calculate initial daily budget
    const dailyBudget = this.calculator.calculateDailyBudget(amount, daysToLast);

    // Update state
    this.setState({
      income: {
        amount,
        daysToLast,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      budget: {
        startingBalance: amount,
        currentBalance: amount,
        dailyBudget,
        todaySpent: 0,
        totalSpent: 0,
        savingsFund: 0,
        cycleStartDate: startDate.toISOString(),
        cycleEndDate: endDate.toISOString(),
        daysRemaining: daysToLast
      },
      expenses: []
    });

    return true;
  }

  /**
   * Add an expense and recalculate budget
   * @param {Object} expense - Expense object {amount, description, category, date}
   * @returns {boolean} True if expense was added successfully
   */
  addExpense(expense) {
    // Validate expense
    if (!expense || typeof expense !== 'object') {
      console.error('addExpense: Invalid expense object', expense);
      return false;
    }

    if (!validateAmount(expense.amount)) {
      console.error('addExpense: Invalid expense amount', expense.amount);
      return false;
    }

    // Create expense with defaults
    const newExpense = {
      id: Date.now().toString(),
      amount: expense.amount,
      description: expense.description || '',
      category: expense.category || 'other',
      date: expense.date || getToday().toISOString(),
      timestamp: Date.now()
    };

    // Add expense to list
    const updatedExpenses = [...this.state.expenses, newExpense];

    // Subtract expense from current balance
    const newBalance = this.calculator.subtractExpense(
      this.state.budget.currentBalance,
      expense.amount
    );

    // Recalculate daily budget
    const newDailyBudget = this.calculator.recalculateBudget(
      newBalance,
      this.state.budget.daysRemaining
    );

    // Calculate today's spending
    const todayExpenses = this.getTodayExpenses(updatedExpenses);
    const todaySpent = this.calculator.calculateTotalSpent(todayExpenses);

    // Calculate total spent
    const totalSpent = this.calculator.calculateTotalSpent(updatedExpenses);

    // Update state
    this.setState({
      expenses: updatedExpenses,
      budget: {
        ...this.state.budget,
        currentBalance: newBalance,
        dailyBudget: newDailyBudget,
        todaySpent,
        totalSpent
      }
    });

    return true;
  }

  /**
   * Get expenses for today
   * @param {Array} expenses - Optional expenses array (uses state.expenses if not provided)
   * @returns {Array} Array of today's expenses
   */
  getTodayExpenses(expenses = null) {
    const expenseList = expenses || this.state.expenses;
    const today = getToday();

    return expenseList.filter(expense => {
      if (!expense.date) return false;

      const expenseDate = new Date(expense.date);
      expenseDate.setHours(0, 0, 0, 0);

      return expenseDate.getTime() === today.getTime();
    });
  }

  /**
   * Calculate and update days remaining until end of cycle
   * @returns {number} Updated days remaining
   */
  calculateDaysRemaining() {
    if (!this.state.budget.cycleEndDate) {
      return 0;
    }

    const daysRemaining = getDaysUntil(this.state.budget.cycleEndDate);

    // Update state if different
    if (daysRemaining !== this.state.budget.daysRemaining) {
      // Also recalculate daily budget with new days remaining
      const newDailyBudget = this.calculator.recalculateBudget(
        this.state.budget.currentBalance,
        daysRemaining
      );

      this.setState({
        budget: {
          ...this.state.budget,
          daysRemaining,
          dailyBudget: newDailyBudget
        }
      });
    }

    return daysRemaining;
  }

  /**
   * Add amount to savings fund and subtract from current balance
   * @param {number} amount - Amount to add to savings
   * @returns {boolean} True if successful
   */
  addToSavings(amount) {
    // Validate amount
    if (!validateAmount(amount)) {
      console.error('addToSavings: Invalid amount', amount);
      return false;
    }

    // Check if enough balance
    if (amount > this.state.budget.currentBalance) {
      console.error('addToSavings: Insufficient balance');
      return false;
    }

    // Update balances
    const newBalance = this.calculator.subtractExpense(
      this.state.budget.currentBalance,
      amount
    );

    const newSavingsFund = this.state.budget.savingsFund + amount;

    // Recalculate daily budget
    const newDailyBudget = this.calculator.recalculateBudget(
      newBalance,
      this.state.budget.daysRemaining
    );

    this.setState({
      budget: {
        ...this.state.budget,
        currentBalance: newBalance,
        savingsFund: newSavingsFund,
        dailyBudget: newDailyBudget
      }
    });

    return true;
  }

  /**
   * Delete an expense by ID and recalculate budget
   * @param {string} expenseId - ID of expense to delete
   * @returns {boolean} True if successful
   */
  deleteExpense(expenseId) {
    const expenseIndex = this.state.expenses.findIndex(e => e.id === expenseId);

    if (expenseIndex === -1) {
      console.error('deleteExpense: Expense not found', expenseId);
      return false;
    }

    const expense = this.state.expenses[expenseIndex];

    // Remove expense from list
    const updatedExpenses = this.state.expenses.filter(e => e.id !== expenseId);

    // Add expense amount back to balance
    const newBalance = this.state.budget.currentBalance + expense.amount;

    // Recalculate daily budget
    const newDailyBudget = this.calculator.recalculateBudget(
      newBalance,
      this.state.budget.daysRemaining
    );

    // Recalculate today's spending
    const todayExpenses = this.getTodayExpenses(updatedExpenses);
    const todaySpent = this.calculator.calculateTotalSpent(todayExpenses);

    // Recalculate total spent
    const totalSpent = this.calculator.calculateTotalSpent(updatedExpenses);

    // Update state
    this.setState({
      expenses: updatedExpenses,
      budget: {
        ...this.state.budget,
        currentBalance: newBalance,
        dailyBudget: newDailyBudget,
        todaySpent,
        totalSpent
      }
    });

    return true;
  }

  /**
   * Save current state to localStorage
   * @returns {boolean} True if save was successful
   */
  saveState() {
    return saveToStorage(this.storageKey, this.state);
  }

  /**
   * Reset all state to defaults and clear localStorage
   */
  resetState() {
    this.state = this.getDefaultState();
    this.saveState();
    this.emitChange();
  }

  /**
   * Subscribe to state changes
   * @param {Function} listener - Callback function to be called on state changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    if (typeof listener !== 'function') {
      console.error('subscribe: Listener must be a function');
      return () => {};
    }

    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Emit change event to all listeners
   * @private
   */
  emitChange() {
    const state = this.getState();
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in state change listener:', error);
      }
    });
  }

  /**
   * Update UI state
   * @param {Object} uiUpdates - UI state updates
   */
  updateUI(uiUpdates) {
    this.setState({
      ui: {
        ...this.state.ui,
        ...uiUpdates
      }
    });
  }
}

// Export singleton instance
export default new BudgetStore();
