/**
 * Budget Store - Central State Management
 * Daily Budget Tracker
 *
 * Manages all application state, handles state updates,
 * emits change events, and persists data to localStorage.
 */

import { BudgetCalculator } from '../models/BudgetCalculator.js';
import { getToday, getDaysUntil, formatDate, addDays } from '../utils/dateUtils.js';
import { validateAmount, formatMoney } from '../utils/moneyUtils.js';
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

      // Backward compatibility: Add initialExpenses if missing
      if (!savedState.initialExpenses) {
        savedState.initialExpenses = {
          fund: 0,
          totalCommitted: 0,
          totalPaid: 0,
          items: []
        };
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
        endDate: null,
        frequency: 'one-time',
        nextPayday: null
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
      initialExpenses: {
        fund: 0,
        totalCommitted: 0,
        totalPaid: 0,
        items: []
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
   * Set up income and initialize budget cycle
   * @param {number} amount - Income amount
   * @param {number} daysToLast - Number of days until next income
   * @param {string} frequency - Income frequency: 'one-time', 'weekly', 'bi-weekly', 'semi-monthly', 'monthly'
   * @param {string|Date} nextPayday - Next payday date (for recurring income)
   * @returns {boolean} True if setup was successful
   */
  setupIncome(amount, daysToLast, frequency = 'one-time', nextPayday = null) {
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
        endDate: endDate.toISOString(),
        frequency: frequency || 'one-time',
        nextPayday: nextPayday ? (typeof nextPayday === 'string' ? nextPayday : nextPayday.toISOString()) : null
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

    // Recalculate daily budget (accounting for initial expenses fund)
    const availableBalance = newBalance - this.state.initialExpenses.fund;
    const newDailyBudget = this.calculator.recalculateBudget(
      availableBalance,
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
      // Also recalculate daily budget with new days remaining (accounting for initial expenses fund)
      const availableBalance = this.state.budget.currentBalance - this.state.initialExpenses.fund;
      const newDailyBudget = this.calculator.recalculateBudget(
        availableBalance,
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

    // Recalculate daily budget (accounting for initial expenses fund)
    const availableBalance = newBalance - this.state.initialExpenses.fund;
    const newDailyBudget = this.calculator.recalculateBudget(
      availableBalance,
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

    // Recalculate daily budget (accounting for initial expenses fund)
    const availableBalance = newBalance - this.state.initialExpenses.fund;
    const newDailyBudget = this.calculator.recalculateBudget(
      availableBalance,
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
   * Add an initial expense (reserved for known upcoming costs)
   * @param {Object} expense - Initial expense object {description, amount, category, notes}
   * @returns {boolean} True if successful
   */
  addInitialExpense(expense) {
    // Validate expense
    if (!expense || typeof expense !== 'object') {
      console.error('addInitialExpense: Invalid expense object', expense);
      return false;
    }

    if (!validateAmount(expense.amount) || expense.amount <= 0) {
      console.error('addInitialExpense: Invalid expense amount', expense.amount);
      return false;
    }

    // Check if enough balance
    if (expense.amount > this.state.budget.currentBalance) {
      console.error('addInitialExpense: Insufficient balance');
      return false;
    }

    // Create initial expense with defaults
    const newInitialExpense = {
      id: Date.now().toString(),
      description: expense.description || 'Initial Expense',
      amount: expense.amount,
      category: expense.category || null,
      isPaid: false,
      paidDate: null,
      notes: expense.notes || '',
      timestamp: Date.now()
    };

    // Add to items array
    const updatedItems = [...this.state.initialExpenses.items, newInitialExpense];

    // Update fund and totals (RESERVE funds, don't deduct from balance yet)
    const newFund = this.state.initialExpenses.fund + expense.amount;
    const newTotalCommitted = this.state.initialExpenses.totalCommitted + expense.amount;

    // Recalculate daily budget (accounting for reserved funds)
    // Balance stays the same, but available balance for daily budget is reduced
    const availableBalance = this.state.budget.currentBalance - newFund;
    const newDailyBudget = this.calculator.calculateDailyBudget(
      availableBalance,
      this.state.budget.daysRemaining
    );

    // Update state
    this.setState({
      initialExpenses: {
        ...this.state.initialExpenses,
        fund: newFund,
        totalCommitted: newTotalCommitted,
        items: updatedItems
      },
      budget: {
        ...this.state.budget,
        // Balance stays the same - only reserved, not spent yet
        dailyBudget: newDailyBudget
      }
    });

    return true;
  }

  /**
   * Remove an initial expense
   * @param {string} expenseId - ID of expense to remove
   * @returns {boolean} True if successful
   */
  removeInitialExpense(expenseId) {
    const expense = this.state.initialExpenses.items.find(e => e.id === expenseId);

    if (!expense) {
      console.error('removeInitialExpense: Expense not found', expenseId);
      return false;
    }

    // Can't remove expenses that are already paid
    if (expense.isPaid) {
      console.error('removeInitialExpense: Cannot remove paid expense');
      return false;
    }

    // Remove from items array
    const updatedItems = this.state.initialExpenses.items.filter(e => e.id !== expenseId);

    // Update fund and totals (UNRESERVE funds)
    const newFund = this.state.initialExpenses.fund - expense.amount;
    const newTotalCommitted = this.state.initialExpenses.totalCommitted - expense.amount;

    // Recalculate daily budget (more funds available now)
    // Balance stays the same - we're just unreserving, not adding money back
    const availableBalance = this.state.budget.currentBalance - newFund;
    const newDailyBudget = this.calculator.calculateDailyBudget(
      availableBalance,
      this.state.budget.daysRemaining
    );

    // Update state
    this.setState({
      initialExpenses: {
        ...this.state.initialExpenses,
        fund: newFund,
        totalCommitted: newTotalCommitted,
        items: updatedItems
      },
      budget: {
        ...this.state.budget,
        // Balance stays the same - we only unreserved, didn't add money
        dailyBudget: newDailyBudget
      }
    });

    return true;
  }

  /**
   * Mark an initial expense as paid
   * @param {string} expenseId - ID of expense to mark as paid
   * @returns {boolean} True if successful
   */
  markInitialExpenseAsPaid(expenseId) {
    const expenseIndex = this.state.initialExpenses.items.findIndex(e => e.id === expenseId);

    if (expenseIndex === -1) {
      console.error('markInitialExpenseAsPaid: Expense not found', expenseId);
      return false;
    }

    const expense = this.state.initialExpenses.items[expenseIndex];

    // Check if already paid
    if (expense.isPaid) {
      console.error('markInitialExpenseAsPaid: Expense already paid');
      return false;
    }

    // Update expense
    const updatedItems = [...this.state.initialExpenses.items];
    updatedItems[expenseIndex] = {
      ...expense,
      isPaid: true,
      paidDate: getToday().toISOString()
    };

    // Decrease fund and increase totalPaid
    const newFund = this.state.initialExpenses.fund - expense.amount;
    const newTotalPaid = this.state.initialExpenses.totalPaid + expense.amount;

    // NOW deduct from balance (actually spending the money)
    const newBalance = this.calculator.subtractExpense(
      this.state.budget.currentBalance,
      expense.amount
    );

    // Recalculate daily budget
    const availableBalance = newBalance - newFund;
    const newDailyBudget = this.calculator.calculateDailyBudget(
      availableBalance,
      this.state.budget.daysRemaining
    );

    // Update state
    this.setState({
      initialExpenses: {
        ...this.state.initialExpenses,
        fund: newFund,
        totalPaid: newTotalPaid,
        items: updatedItems
      },
      budget: {
        ...this.state.budget,
        currentBalance: newBalance, // Balance decreases when marked as paid
        dailyBudget: newDailyBudget
      }
    });

    return true;
  }

  /**
   * Get unpaid initial expenses
   * @returns {Array} Array of unpaid initial expenses
   */
  getUnpaidInitialExpenses() {
    return this.state.initialExpenses.items.filter(expense => !expense.isPaid);
  }

  /**
   * Get paid initial expenses
   * @returns {Array} Array of paid initial expenses
   */
  getPaidInitialExpenses() {
    return this.state.initialExpenses.items.filter(expense => expense.isPaid);
  }

  /**
   * Calculate total fund for unpaid initial expenses
   * @returns {number} Total fund amount
   */
  calculateInitialExpensesFund() {
    return this.getUnpaidInitialExpenses().reduce((sum, expense) => sum + expense.amount, 0);
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

  /**
   * Check if today is payday and handle auto-rollover for recurring income
   * Should be called on app initialization and periodically
   * @returns {boolean} True if rollover occurred
   */
  checkAndHandlePayday() {
    // Only process for recurring income
    if (this.state.income.frequency === 'one-time' || !this.state.income.nextPayday) {
      return false;
    }

    const today = getToday();
    const nextPayday = new Date(this.state.income.nextPayday);
    nextPayday.setHours(0, 0, 0, 0);

    // Check if today is payday or later
    if (today.getTime() < nextPayday.getTime()) {
      return false;
    }

    console.log('Payday detected! Rolling over to next cycle...');

    // Perform rollover
    return this.rolloverToNextCycle();
  }

  /**
   * Rollover to the next pay cycle for recurring income
   * @private
   * @returns {boolean} True if successful
   */
  rolloverToNextCycle() {
    const frequency = this.state.income.frequency;
    const amount = this.state.income.amount;
    const currentPayday = new Date(this.state.income.nextPayday);

    // Calculate next payday based on frequency
    let nextPayday;
    let daysUntilNext;

    switch (frequency) {
      case 'weekly':
        nextPayday = addDays(currentPayday, 7);
        daysUntilNext = 7;
        break;

      case 'bi-weekly':
        nextPayday = addDays(currentPayday, 14);
        daysUntilNext = 14;
        break;

      case 'semi-monthly':
        nextPayday = addDays(currentPayday, 15);
        daysUntilNext = 15;
        break;

      case 'monthly':
        nextPayday = new Date(currentPayday);
        nextPayday.setMonth(nextPayday.getMonth() + 1);
        // Handle edge case where day doesn't exist in next month
        if (nextPayday.getDate() !== currentPayday.getDate()) {
          nextPayday.setDate(0);
        }
        daysUntilNext = getDaysUntil(nextPayday);
        break;

      default:
        console.error('rolloverToNextCycle: Invalid frequency', frequency);
        return false;
    }

    const today = getToday();
    const endDate = addDays(today, daysUntilNext);

    // Reset balance to income amount (fresh paycheck)
    const newBalance = amount;

    // Recalculate daily budget (accounting for initial expenses fund)
    const availableBalance = newBalance - this.state.initialExpenses.fund;
    const dailyBudget = this.calculator.calculateDailyBudget(availableBalance, daysUntilNext);

    // Archive current cycle data (for future Phase 3 - history tracking)
    // TODO: In Phase 3, save current cycle to history before resetting

    // Update state for new cycle
    this.setState({
      income: {
        ...this.state.income,
        daysToLast: daysUntilNext,
        startDate: today.toISOString(),
        endDate: endDate.toISOString(),
        nextPayday: nextPayday.toISOString()
      },
      budget: {
        ...this.state.budget,
        startingBalance: amount,
        currentBalance: newBalance,
        dailyBudget,
        todaySpent: 0,
        cycleStartDate: today.toISOString(),
        cycleEndDate: endDate.toISOString(),
        daysRemaining: daysUntilNext
      },
      // Note: Keep expenses array for history
      // Note: Keep initial expenses (they carry over to next cycle)
      // TODO Phase 2.2: Apply recurring expenses automatically
    });

    console.log('Rollover complete!', {
      newBalance: formatMoney(newBalance),
      nextPayday: formatDate(nextPayday, 'long'),
      daysUntilNext
    });

    // Emit event for UI updates
    this.emitPaydayEvent({
      amount,
      nextPayday: nextPayday.toISOString(),
      daysUntilNext
    });

    return true;
  }

  /**
   * Emit payday event
   * @private
   * @param {Object} detail - Event detail data
   */
  emitPaydayEvent(detail) {
    const event = new CustomEvent('payday-rollover', {
      detail,
      bubbles: true
    });
    document.dispatchEvent(event);
  }

  /**
   * Calculate the next payday date based on current payday and frequency
   * @param {Date|string} currentPayday - Current payday date
   * @param {string} frequency - Income frequency
   * @returns {Date} Next payday date
   */
  calculateNextPayday(currentPayday, frequency) {
    const current = new Date(currentPayday);

    switch (frequency) {
      case 'weekly':
        return addDays(current, 7);

      case 'bi-weekly':
        return addDays(current, 14);

      case 'semi-monthly':
        return addDays(current, 15);

      case 'monthly':
        const next = new Date(current);
        next.setMonth(next.getMonth() + 1);
        if (next.getDate() !== current.getDate()) {
          next.setDate(0);
        }
        return next;

      default:
        return addDays(current, 14);
    }
  }
}

// Export singleton instance
export default new BudgetStore();
