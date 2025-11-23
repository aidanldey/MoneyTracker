/**
 * Main Application Entry Point
 * Daily Budget Tracker
 *
 * Initializes all modules and coordinates the application lifecycle.
 */

// Import all modules
import store from './state/BudgetStore.js';
import dashboard from './features/Dashboard.js';
import incomeSetup from './features/IncomeSetup.js';
import expenseForm from './features/ExpenseForm.js';
import initialExpensesForm from './features/InitialExpensesForm.js';
import initialExpensesList from './features/InitialExpensesList.js';
import { getToday } from './utils/dateUtils.js';

/**
 * Application class - Main controller
 */
class App {
  /**
   * Initialize the application
   */
  constructor() {
    this.initialized = false;
    this.lastUpdateCheck = null;
  }

  /**
   * Initialize the app when DOM is ready
   */
  init() {
    if (this.initialized) {
      console.warn('App already initialized');
      return;
    }

    console.log('🚀 Initializing Daily Budget Tracker...');

    try {
      // Check for daily rollover
      this.checkDailyRollover();

      // Initialize dashboard
      dashboard.init();

      // Set up global event listeners
      this.setupEventListeners();

      // Mark as initialized
      this.initialized = true;

      console.log('✅ App initialized successfully');

      // Log current state for debugging
      this.logAppState();
    } catch (error) {
      console.error('❌ Error initializing app:', error);
      this.handleInitError(error);
    }
  }

  /**
   * Check for daily rollover and reset today's spent if needed
   * Also checks for recurring income payday rollover
   * @private
   */
  checkDailyRollover() {
    const state = store.getState();

    // If no income set up, skip rollover check
    if (state.income.amount === 0) {
      console.log('ℹ️ No income configured, skipping rollover check');
      return;
    }

    // Check if we have a cycle start date
    if (!state.budget.cycleStartDate) {
      console.log('ℹ️ No cycle start date, skipping rollover check');
      return;
    }

    // Check for recurring income payday rollover FIRST
    const paydayOccurred = store.checkAndHandlePayday();
    if (paydayOccurred) {
      console.log('💰 Payday rollover completed');
      // If payday occurred, the state was already updated, so we can skip the rest
      dashboard.refresh();
      return;
    }

    // Get today's date
    const today = getToday();

    // Get all expenses
    const expenses = state.expenses || [];

    // Get today's expenses
    const todayExpenses = store.getTodayExpenses(expenses);

    // Calculate today's actual spent
    const actualTodaySpent = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    // If todaySpent doesn't match actual, update it
    if (Math.abs(state.budget.todaySpent - actualTodaySpent) > 0.01) {
      console.log('🔄 Syncing today\'s spent:', {
        stored: state.budget.todaySpent,
        actual: actualTodaySpent
      });

      store.setState({
        budget: {
          ...state.budget,
          todaySpent: actualTodaySpent
        }
      });
    }

    // Update days remaining
    store.calculateDaysRemaining();

    console.log('✅ Daily rollover check complete');
  }

  /**
   * Set up global event listeners
   * @private
   */
  setupEventListeners() {
    // Listen for unhandled errors
    window.addEventListener('error', (event) => {
      console.error('Unhandled error:', event.error);
    });

    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
    });

    // Listen for page visibility changes (for rollover check)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        console.log('👁️ Page became visible, checking for updates...');
        this.checkDailyRollover();
        dashboard.refresh();
      }
    });

    // Periodic rollover check (every 5 minutes)
    setInterval(() => {
      this.checkDailyRollover();
    }, 5 * 60 * 1000);

    console.log('✅ Global event listeners set up');
  }

  /**
   * Handle initialization errors
   * @private
   * @param {Error} error - The error that occurred
   */
  handleInitError(error) {
    // Show user-friendly error message
    const errorMessage = document.createElement('div');
    errorMessage.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--color-status-danger);
      color: white;
      padding: var(--spacing-xl);
      border-radius: var(--radius-lg);
      text-align: center;
      max-width: 90%;
      z-index: 9999;
    `;
    errorMessage.innerHTML = `
      <h2 style="margin: 0 0 var(--spacing-md) 0;">Initialization Error</h2>
      <p style="margin: 0;">The app failed to start. Please refresh the page.</p>
      <p style="margin: var(--spacing-sm) 0 0 0; font-size: var(--font-size-small); opacity: 0.8;">
        Error: ${error.message}
      </p>
    `;
    document.body.appendChild(errorMessage);
  }

  /**
   * Log current app state for debugging
   * @private
   */
  logAppState() {
    const state = store.getState();

    console.group('📊 Current App State');
    console.log('Income configured:', state.income.amount > 0);
    console.log('Current balance:', state.budget.currentBalance);
    console.log('Daily budget:', state.budget.dailyBudget);
    console.log('Today spent:', state.budget.todaySpent);
    console.log('Days remaining:', state.budget.daysRemaining);
    console.log('Total expenses:', state.expenses.length);
    console.groupEnd();
  }

  /**
   * Get app info
   * @returns {Object} App information
   */
  getInfo() {
    return {
      name: 'Daily Budget Tracker',
      version: '1.0.0',
      initialized: this.initialized,
      state: store.getState()
    };
  }

  /**
   * Reset the entire app (for testing)
   */
  reset() {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      console.log('🔄 Resetting app...');
      store.resetState();
      window.location.reload();
    }
  }
}

// Create app instance
const app = new App();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app.init();
  });
} else {
  // DOM is already ready
  app.init();
}

// Export for debugging in console
window.budgetApp = app;
window.budgetStore = store;

// Development helpers
if (import.meta.env?.MODE === 'development') {
  console.log('🛠️ Development mode - Debug tools available:');
  console.log('  - window.budgetApp: App instance');
  console.log('  - window.budgetStore: BudgetStore instance');
  console.log('  - budgetApp.reset(): Reset all data');
  console.log('  - budgetApp.getInfo(): Get app info');
}

export default app;
