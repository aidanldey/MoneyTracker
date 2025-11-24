/**
 * Dashboard Controller
 * Daily Budget Tracker
 *
 * Main controller that coordinates all features and renders the dashboard.
 * Ties together BudgetStore, IncomeSetup, and ExpenseForm.
 */

import store from '../state/BudgetStore.js';
import calculator from '../models/BudgetCalculator.js';
import { formatMoney } from '../utils/moneyUtils.js';
import { formatDate } from '../utils/dateUtils.js';
import initialExpensesList from './InitialExpensesList.js';
import { getEndOfDay } from './EndOfDay.js';

/**
 * Dashboard class manages the main dashboard view
 */
export class Dashboard {
  /**
   * Initialize the Dashboard
   */
  constructor() {
    // Get DOM elements
    this.heroSection = document.querySelector('.hero-section');
    this.heroAmount = document.querySelector('[data-value="remaining-today"]');
    this.statusIndicator = document.querySelector('.status-indicator');

    this.totalBalanceEl = document.querySelector('[data-value="total-balance"]');
    this.savingsFundEl = document.querySelector('[data-value="savings-fund"]');
    this.dailyBudgetEl = document.querySelector('[data-value="daily-budget"]');
    this.daysRemainingEl = document.querySelector('[data-value="days-remaining"]');
    this.endDateEl = document.querySelector('[data-value="end-date"]');

    this.todaySpentEl = document.querySelector('[data-value="today-spent"]');
    this.expenseListEl = document.querySelector('[data-list="today-expenses"]');
    this.toggleExpensesBtn = document.querySelector('[data-action="toggle-expenses"]');

    // Initial Expenses card elements
    this.initialExpensesCard = document.getElementById('initial-expenses-card');
    this.initialExpensesFundEl = document.getElementById('initial-expenses-fund');
    this.unpaidCountEl = document.getElementById('unpaid-count');
    this.manageInitialExpensesBtn = document.getElementById('manage-initial-expenses-btn');
    this.quickInitialExpensesBtn = document.getElementById('quick-initial-expenses-btn');
    this.initialExpensesInfoBtn = document.getElementById('initial-expenses-info-btn');

    // Hint banner elements
    this.hintBanner = document.getElementById('initial-expenses-hint');
    this.hintAddBtn = document.getElementById('hint-add-expenses-btn');
    this.hintDismissBtn = document.getElementById('hint-dismiss-btn');

    // End of day button
    this.endOfDayBtn = document.getElementById('end-of-day-btn');

    // Bind methods
    this.handleStateChange = this.handleStateChange.bind(this);
    this.handleToggleExpenses = this.handleToggleExpenses.bind(this);
    this.handleManageInitialExpenses = this.handleManageInitialExpenses.bind(this);
    this.handleInfoClick = this.handleInfoClick.bind(this);
    this.handleHintDismiss = this.handleHintDismiss.bind(this);
    this.handleEndOfDay = this.handleEndOfDay.bind(this);

    // Track collapse state
    this.expensesExpanded = true;
  }

  /**
   * Initialize the dashboard
   */
  init() {
    console.log('Initializing Dashboard...');

    // Subscribe to state changes
    store.subscribe(this.handleStateChange);

    // Set up event listeners
    this.initEventListeners();

    // Initial render
    this.render();

    console.log('Dashboard initialized');
  }

  /**
   * Initialize event listeners
   * @private
   */
  initEventListeners() {
    // Toggle expenses list
    if (this.toggleExpensesBtn) {
      this.toggleExpensesBtn.addEventListener('click', this.handleToggleExpenses);
    }

    // Manage initial expenses buttons
    if (this.manageInitialExpensesBtn) {
      this.manageInitialExpensesBtn.addEventListener('click', this.handleManageInitialExpenses);
    }

    if (this.quickInitialExpensesBtn) {
      this.quickInitialExpensesBtn.addEventListener('click', this.handleManageInitialExpenses);
    }

    // Info button
    if (this.initialExpensesInfoBtn) {
      this.initialExpensesInfoBtn.addEventListener('click', this.handleInfoClick);
    }

    // Hint banner buttons
    if (this.hintAddBtn) {
      this.hintAddBtn.addEventListener('click', this.handleManageInitialExpenses);
    }

    if (this.hintDismissBtn) {
      this.hintDismissBtn.addEventListener('click', this.handleHintDismiss);
    }

    // Listen for income-saved event
    document.addEventListener('income-saved', () => {
      console.log('Income saved, re-rendering dashboard');
      this.render();
    });

    // Listen for expense-added event
    document.addEventListener('expense-added', () => {
      console.log('Expense added, re-rendering dashboard');
      this.render();
    });

    // Listen for income-setup-complete event (includes initial expenses)
    document.addEventListener('income-setup-complete', () => {
      console.log('Income setup complete, re-rendering dashboard');
      this.render();
    });

    // Listen for initial expense changes
    document.addEventListener('initial-expense-added', () => {
      console.log('Initial expense added, re-rendering dashboard');
      this.render();
    });

    // End of day button
    if (this.endOfDayBtn) {
      this.endOfDayBtn.addEventListener('click', this.handleEndOfDay);
    }

    // Listen for day-reconciled event
    document.addEventListener('day-reconciled', () => {
      console.log('Day reconciled, re-rendering dashboard');
      this.render();
    });

    // Listen for budget-updated event (from EndOfDay)
    document.addEventListener('budget-updated', () => {
      console.log('Budget updated, re-rendering dashboard');
      this.render();
    });
  }

  /**
   * Render the entire dashboard with current state
   */
  render() {
    const state = store.getState();

    // Check if income is set up
    if (state.income.amount === 0) {
      this.renderEmptyState();
      return;
    }

    // Calculate remaining today
    const remainingToday = calculator.calculateRemainingToday(
      state.budget.dailyBudget,
      state.budget.todaySpent
    );

    // Determine status
    const status = calculator.getStatusLevel(
      remainingToday,
      state.budget.dailyBudget
    );

    // Update all sections
    this.updateHeroSection(remainingToday, status);
    this.updateSummaryCards(state.budget);
    this.updateInitialExpensesCard(state.initialExpenses);
    this.updateHintBanner(state.initialExpenses);
    this.updateTodayExpenses(state.expenses);
  }

  /**
   * Render empty state when no income is set
   * @private
   */
  renderEmptyState() {
    // Hero section
    if (this.heroAmount) {
      this.heroAmount.textContent = '$0.00';
    }

    // Reset all cards
    if (this.totalBalanceEl) this.totalBalanceEl.textContent = '$0.00';
    if (this.savingsFundEl) this.savingsFundEl.textContent = '$0.00';
    if (this.dailyBudgetEl) this.dailyBudgetEl.textContent = '$0.00';
    if (this.daysRemainingEl) {
      const daysNumber = this.daysRemainingEl.querySelector('.days-number');
      if (daysNumber) daysNumber.textContent = '0';
    }
    if (this.endDateEl) this.endDateEl.textContent = 'Until: --/--/----';

    // Reset today's expenses
    if (this.todaySpentEl) this.todaySpentEl.textContent = '$0.00';
    if (this.expenseListEl) {
      this.expenseListEl.innerHTML = '<p class="empty-state">Set up your income to get started</p>';
    }

    // Set default status
    this.setStatus('good');
  }

  /**
   * Update hero section with remaining today and status
   * @param {number} remainingToday - Remaining budget for today
   * @param {string} status - Status level (good/warning/danger)
   */
  updateHeroSection(remainingToday, status) {
    // Update amount
    if (this.heroAmount) {
      this.heroAmount.textContent = formatMoney(remainingToday);
    }

    // Update status
    this.setStatus(status);
  }

  /**
   * Set status indicator and hero section background
   * @private
   * @param {string} status - Status level
   */
  setStatus(status) {
    // Update status indicator
    if (this.statusIndicator) {
      this.statusIndicator.setAttribute('data-status', status);
      this.statusIndicator.setAttribute('aria-label', `Budget status: ${status}`);
    }

    // Update hero section background
    if (this.heroSection) {
      this.heroSection.setAttribute('data-status', status);
    }
  }

  /**
   * Update summary cards with budget data
   * @param {Object} budget - Budget state object
   */
  updateSummaryCards(budget) {
    // Total Balance
    if (this.totalBalanceEl) {
      this.totalBalanceEl.textContent = formatMoney(budget.currentBalance);
    }

    // Savings Fund
    if (this.savingsFundEl) {
      this.savingsFundEl.textContent = formatMoney(budget.savingsFund);
    }

    // Daily Budget
    if (this.dailyBudgetEl) {
      this.dailyBudgetEl.textContent = formatMoney(budget.dailyBudget);
    }

    // Days Remaining
    if (this.daysRemainingEl) {
      const daysNumber = this.daysRemainingEl.querySelector('.days-number');
      if (daysNumber) {
        daysNumber.textContent = budget.daysRemaining;
      }
    }

    // End Date
    if (this.endDateEl && budget.cycleEndDate) {
      const formattedDate = formatDate(budget.cycleEndDate, 'short');
      this.endDateEl.textContent = `Until: ${formattedDate}`;
    }
  }

  /**
   * Update Initial Expenses card
   * @param {Object} initialExpenses - Initial expenses state
   */
  updateInitialExpensesCard(initialExpenses) {
    // Skip if elements not found (card might not exist in HTML yet)
    if (!this.initialExpensesCard || !this.initialExpensesFundEl || !this.unpaidCountEl) {
      return;
    }

    const fund = initialExpenses.fund;
    const unpaidExpenses = store.getUnpaidInitialExpenses();
    const unpaidCount = unpaidExpenses.length;
    const totalItems = initialExpenses.items.length;

    // Update fund amount
    this.initialExpensesFundEl.textContent = formatMoney(fund);

    // Update count text
    let countText;
    if (totalItems === 0) {
      countText = 'No obligations yet';
    } else if (unpaidCount === 0) {
      countText = 'All paid! 🎉';
    } else if (unpaidCount === 1) {
      countText = '1 unpaid obligation';
    } else {
      countText = `${unpaidCount} unpaid obligations`;
    }
    this.unpaidCountEl.textContent = countText;

    // Show/hide card based on whether user has initial expenses
    if (totalItems > 0) {
      this.initialExpensesCard.style.display = 'block';
    } else {
      this.initialExpensesCard.style.display = 'none';
    }
  }

  /**
   * Update hint banner visibility
   * @param {Object} initialExpenses - Initial expenses state
   */
  updateHintBanner(initialExpenses) {
    // Skip if hint banner not found
    if (!this.hintBanner) return;

    // Check if hint was dismissed
    const dismissed = localStorage.getItem('initialExpensesHintDismissed') === 'true';

    // Show hint if:
    // 1. User has income set up
    // 2. User has no initial expenses
    // 3. Hint hasn't been dismissed
    const state = store.getState();
    const shouldShow = state.income.amount > 0 &&
                       initialExpenses.items.length === 0 &&
                       !dismissed;

    if (shouldShow) {
      this.hintBanner.style.display = 'flex';
    } else {
      this.hintBanner.style.display = 'none';
    }
  }

  /**
   * Update today's expenses section
   * @param {Array} allExpenses - All expenses from state
   */
  updateTodayExpenses(allExpenses) {
    // Get today's expenses
    const todayExpenses = store.getTodayExpenses(allExpenses);

    // Calculate today's total
    const todayTotal = calculator.calculateTotalSpent(todayExpenses);

    // Update today's spent
    if (this.todaySpentEl) {
      this.todaySpentEl.textContent = formatMoney(todayTotal);
    }

    // Render expense list
    this.renderExpenseList(todayExpenses);
  }

  /**
   * Render the expense list
   * @private
   * @param {Array} expenses - Today's expenses
   */
  renderExpenseList(expenses) {
    if (!this.expenseListEl) return;

    // Clear current list
    this.expenseListEl.innerHTML = '';

    // Check if empty
    if (expenses.length === 0) {
      this.expenseListEl.innerHTML = '<p class="empty-state">No expenses today</p>';
      return;
    }

    // Create expense items
    expenses.forEach(expense => {
      const expenseItem = this.createExpenseItem(expense);
      this.expenseListEl.appendChild(expenseItem);
    });
  }

  /**
   * Create an expense item element
   * @private
   * @param {Object} expense - Expense object
   * @returns {HTMLElement} Expense item element
   */
  createExpenseItem(expense) {
    const item = document.createElement('div');
    item.className = 'expense-item';
    item.setAttribute('data-expense-id', expense.id);

    item.innerHTML = `
      <div class="expense-info">
        <p class="expense-description">${this.escapeHtml(expense.description)}</p>
        <p class="expense-category">${this.escapeHtml(expense.category)}</p>
      </div>
      <span class="expense-amount money-value">${formatMoney(expense.amount)}</span>
    `;

    return item;
  }

  /**
   * Escape HTML to prevent XSS
   * @private
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Handle toggle expenses button click
   * @private
   */
  handleToggleExpenses() {
    this.expensesExpanded = !this.expensesExpanded;

    // Toggle list visibility
    if (this.expenseListEl) {
      if (this.expensesExpanded) {
        this.expenseListEl.removeAttribute('hidden');
      } else {
        this.expenseListEl.setAttribute('hidden', '');
      }
    }

    // Update button aria-expanded
    if (this.toggleExpensesBtn) {
      this.toggleExpensesBtn.setAttribute('aria-expanded', this.expensesExpanded);
    }
  }

  /**
   * Handle manage initial expenses button click
   * @private
   */
  handleManageInitialExpenses() {
    console.log('Opening Initial Expenses List...');
    if (initialExpensesList) {
      initialExpensesList.showList();
    }
  }

  /**
   * Handle info icon click
   * @private
   */
  handleInfoClick() {
    const message = `Initial Expenses (Committed Funds)

These are financial obligations you know you need to pay this cycle, such as:
• Rent or mortgage
• Utility bills
• Insurance premiums
• Loan payments
• Subscriptions

These funds are reserved from your daily budget to ensure you have money when bills are due. Your daily budget is calculated as:

Daily Budget = (Current Balance - Committed Funds) ÷ Days Remaining

This helps you avoid overspending and ensures you can cover your obligations.`;

    alert(message);
  }

  /**
   * Handle end of day button click
   * @private
   */
  handleEndOfDay() {
    console.log('Opening End of Day modal...');
    try {
      const endOfDay = getEndOfDay();
      endOfDay.open();
    } catch (error) {
      console.error('Error opening End of Day modal:', error);
      alert('End of Day feature is not available yet. Please try again later.');
    }
  }

  /**
   * Handle hint dismiss button click
   * @private
   */
  handleHintDismiss() {
    // Store dismissed state
    localStorage.setItem('initialExpensesHintDismissed', 'true');

    // Hide hint banner
    if (this.hintBanner) {
      this.hintBanner.style.display = 'none';
    }
  }

  /**
   * Handle state changes from BudgetStore
   * @private
   * @param {Object} state - New state
   */
  handleStateChange(state) {
    console.log('State changed, re-rendering dashboard', state);
    this.render();
  }

  /**
   * Get current dashboard data
   * @returns {Object} Dashboard data summary
   */
  getDashboardData() {
    const state = store.getState();

    if (state.income.amount === 0) {
      return {
        hasIncome: false,
        remainingToday: 0,
        status: 'good'
      };
    }

    const remainingToday = calculator.calculateRemainingToday(
      state.budget.dailyBudget,
      state.budget.todaySpent
    );

    const status = calculator.getStatusLevel(
      remainingToday,
      state.budget.dailyBudget
    );

    return {
      hasIncome: true,
      remainingToday,
      status,
      ...state.budget
    };
  }

  /**
   * Refresh dashboard (force re-render)
   */
  refresh() {
    console.log('Refreshing dashboard...');
    this.render();
  }
}

// Export singleton instance
export default new Dashboard();
