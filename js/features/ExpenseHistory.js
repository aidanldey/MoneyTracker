/**
 * Expense History Feature
 * Daily Budget Tracker
 *
 * Comprehensive expense history with progressive disclosure:
 * Level 1: Summary (total spent this cycle)
 * Level 2: Daily/Weekly breakdown
 * Level 3: Category breakdown
 * Level 4: Full expense list with search/filter
 */

import store from '../state/BudgetStore.js';
import Expense from '../models/Expense.js';
import { formatMoney } from '../utils/moneyUtils.js';
import { formatDate, getToday, getDaysBetween, isSameDay } from '../utils/dateUtils.js';

/**
 * ExpenseHistory class manages the expense history modal
 */
export class ExpenseHistory {
  constructor() {
    // Get DOM elements
    this.modal = document.getElementById('expense-history-modal');
    this.closeButtons = this.modal?.querySelectorAll('[data-action="close-modal"]');
    this.overlay = this.modal?.querySelector('.modal-overlay');

    // View containers
    this.summaryView = document.getElementById('history-summary-view');
    this.breakdownView = document.getElementById('history-breakdown-view');
    this.categoryView = document.getElementById('history-category-view');
    this.fullListView = document.getElementById('history-full-list-view');

    // Summary elements
    this.totalSpentEl = document.getElementById('history-total-spent');
    this.viewBreakdownBtn = document.getElementById('view-breakdown-btn');

    // Breakdown elements
    this.weeklyBreakdownList = document.getElementById('weekly-breakdown-list');
    this.viewCategoryBtn = document.getElementById('view-category-btn');
    this.viewAllExpensesBtn = document.getElementById('view-all-expenses-btn');
    this.backToSummaryBtn = document.getElementById('back-to-summary-btn');

    // Category elements
    this.categoryBreakdownList = document.getElementById('category-breakdown-list');
    this.viewAllFromCategoryBtn = document.getElementById('view-all-from-category-btn');
    this.backToBreakdownBtn = document.getElementById('back-to-breakdown-btn');

    // Full list elements
    this.searchInput = document.getElementById('expense-search-input');
    this.filterCategorySelect = document.getElementById('filter-category-select');
    this.sortSelect = document.getElementById('expense-sort-select');
    this.expenseListContainer = document.getElementById('expense-list-container');
    this.backToBreakdownBtn2 = document.getElementById('back-to-breakdown-btn-2');
    this.exportCsvBtn = document.getElementById('export-csv-btn');

    // State
    this.currentView = 'summary'; // summary, breakdown, category, fullList
    this.searchQuery = '';
    this.filterCategory = '';
    this.sortBy = 'date-desc'; // date-desc, date-asc, amount-desc, amount-asc
    this.expandedWeeks = new Set();

    // Bind methods
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.handleViewChange = this.handleViewChange.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleFilter = this.handleFilter.bind(this);
    this.handleSort = this.handleSort.bind(this);
    this.handleWeekToggle = this.handleWeekToggle.bind(this);
    this.handleExpenseClick = this.handleExpenseClick.bind(this);
    this.handleDeleteExpense = this.handleDeleteExpense.bind(this);
    this.handleExportCsv = this.handleExportCsv.bind(this);

    // Initialize event listeners
    this.initEventListeners();
  }

  /**
   * Initialize event listeners
   * @private
   */
  initEventListeners() {
    if (!this.modal) return;

    // Close button clicks
    this.closeButtons.forEach(button => {
      button.addEventListener('click', this.close);
    });

    // Overlay click to close
    this.overlay?.addEventListener('click', this.close);

    // View navigation buttons
    this.viewBreakdownBtn?.addEventListener('click', () => this.handleViewChange('breakdown'));
    this.viewCategoryBtn?.addEventListener('click', () => this.handleViewChange('category'));
    this.viewAllExpensesBtn?.addEventListener('click', () => this.handleViewChange('fullList'));
    this.viewAllFromCategoryBtn?.addEventListener('click', () => this.handleViewChange('fullList'));
    this.backToSummaryBtn?.addEventListener('click', () => this.handleViewChange('summary'));
    this.backToBreakdownBtn?.addEventListener('click', () => this.handleViewChange('breakdown'));
    this.backToBreakdownBtn2?.addEventListener('click', () => this.handleViewChange('breakdown'));

    // Search, filter, sort
    this.searchInput?.addEventListener('input', this.handleSearch);
    this.filterCategorySelect?.addEventListener('change', this.handleFilter);
    this.sortSelect?.addEventListener('change', this.handleSort);

    // Export CSV
    this.exportCsvBtn?.addEventListener('click', this.handleExportCsv);

    // Listen for global expense events
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="view-history"]')) {
        this.open();
      }
    });

    // Listen for expense changes
    document.addEventListener('expense-added', () => this.refresh());
    document.addEventListener('expense-deleted', () => this.refresh());
  }

  /**
   * Open the expense history modal
   */
  open() {
    if (!this.modal) return;

    // Reset to summary view
    this.currentView = 'summary';
    this.showView('summary');

    // Render content
    this.renderSummary();

    // Show modal
    this.modal.removeAttribute('hidden');
  }

  /**
   * Close the modal
   */
  close() {
    if (!this.modal) return;
    this.modal.setAttribute('hidden', '');
  }

  /**
   * Refresh current view
   */
  refresh() {
    switch (this.currentView) {
      case 'summary':
        this.renderSummary();
        break;
      case 'breakdown':
        this.renderBreakdown();
        break;
      case 'category':
        this.renderCategoryBreakdown();
        break;
      case 'fullList':
        this.renderFullList();
        break;
    }
  }

  /**
   * Handle view change
   * @param {string} viewName - Name of the view to show
   */
  handleViewChange(viewName) {
    this.currentView = viewName;
    this.showView(viewName);

    // Render the new view
    this.refresh();
  }

  /**
   * Show a specific view and hide others
   * @param {string} viewName - Name of the view to show
   */
  showView(viewName) {
    // Hide all views
    this.summaryView.style.display = 'none';
    this.breakdownView.style.display = 'none';
    this.categoryView.style.display = 'none';
    this.fullListView.style.display = 'none';

    // Show the requested view
    switch (viewName) {
      case 'summary':
        this.summaryView.style.display = 'block';
        break;
      case 'breakdown':
        this.breakdownView.style.display = 'block';
        break;
      case 'category':
        this.categoryView.style.display = 'block';
        break;
      case 'fullList':
        this.fullListView.style.display = 'block';
        break;
    }
  }

  /**
   * Get expenses for current cycle
   * @returns {Array} Expenses in current cycle
   */
  getCycleExpenses() {
    const state = store.getState();
    const cycleStart = state.budget.cycleStartDate;
    const cycleEnd = state.budget.cycleEndDate;

    if (!cycleStart || !cycleEnd) {
      return [];
    }

    const startDate = new Date(cycleStart);
    const endDate = new Date(cycleEnd);

    return state.expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  }

  /**
   * Calculate total spent in current cycle
   * @returns {number} Total spent
   */
  calculateTotalSpent() {
    const expenses = this.getCycleExpenses();
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }

  /**
   * Render Level 1 - Summary view
   */
  renderSummary() {
    const totalSpent = this.calculateTotalSpent();
    this.totalSpentEl.textContent = formatMoney(totalSpent);
  }

  /**
   * Group expenses by week
   * @param {Array} expenses - Expenses to group
   * @returns {Array} Array of week objects with expenses
   */
  groupByWeek(expenses) {
    const weeks = new Map();
    const today = getToday();

    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      const daysDiff = getDaysBetween(expenseDate, today);

      let weekLabel;
      let weekOrder;

      if (daysDiff < 7) {
        weekLabel = 'This Week';
        weekOrder = 0;
      } else if (daysDiff < 14) {
        weekLabel = 'Last Week';
        weekOrder = 1;
      } else if (daysDiff < 21) {
        weekLabel = '2 Weeks Ago';
        weekOrder = 2;
      } else if (daysDiff < 28) {
        weekLabel = '3 Weeks Ago';
        weekOrder = 3;
      } else {
        weekLabel = 'Older';
        weekOrder = 4;
      }

      if (!weeks.has(weekLabel)) {
        weeks.set(weekLabel, {
          label: weekLabel,
          order: weekOrder,
          expenses: [],
          total: 0,
          days: new Map()
        });
      }

      const week = weeks.get(weekLabel);
      week.expenses.push(expense);
      week.total += expense.amount;

      // Group by day within week
      const dateKey = formatDate(expenseDate, 'iso');
      if (!week.days.has(dateKey)) {
        week.days.set(dateKey, {
          date: expenseDate,
          expenses: [],
          total: 0
        });
      }

      const day = week.days.get(dateKey);
      day.expenses.push(expense);
      day.total += expense.amount;
    });

    // Convert to array and sort by order
    return Array.from(weeks.values()).sort((a, b) => a.order - b.order);
  }

  /**
   * Render Level 2 - Breakdown view
   */
  renderBreakdown() {
    const expenses = this.getCycleExpenses();
    const weeks = this.groupByWeek(expenses);

    this.weeklyBreakdownList.innerHTML = '';

    if (weeks.length === 0) {
      this.weeklyBreakdownList.innerHTML = '<p class="empty-state">No expenses in this cycle</p>';
      return;
    }

    weeks.forEach(week => {
      const weekItem = this.createWeekItem(week);
      this.weeklyBreakdownList.appendChild(weekItem);
    });
  }

  /**
   * Create a week item element
   * @param {Object} week - Week data
   * @returns {HTMLElement} Week item element
   */
  createWeekItem(week) {
    const isExpanded = this.expandedWeeks.has(week.label);

    const weekDiv = document.createElement('div');
    weekDiv.className = 'week-item';

    const headerDiv = document.createElement('div');
    headerDiv.className = 'week-header';
    headerDiv.addEventListener('click', () => this.handleWeekToggle(week.label));

    headerDiv.innerHTML = `
      <div class="week-header-left">
        <span class="week-toggle-icon">${isExpanded ? '▼' : '▶'}</span>
        <span class="week-label">${week.label}</span>
      </div>
      <span class="week-total money-value">${formatMoney(week.total)}</span>
    `;

    weekDiv.appendChild(headerDiv);

    if (isExpanded) {
      const daysDiv = document.createElement('div');
      daysDiv.className = 'week-days';

      // Sort days by date (newest first)
      const sortedDays = Array.from(week.days.values()).sort((a, b) => b.date - a.date);

      sortedDays.forEach(day => {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day-item';

        const dayLabel = this.getDayLabel(day.date);

        dayDiv.innerHTML = `
          <span class="day-label">${dayLabel}</span>
          <span class="day-total money-value">${formatMoney(day.total)}</span>
        `;

        daysDiv.appendChild(dayDiv);
      });

      weekDiv.appendChild(daysDiv);
    }

    return weekDiv;
  }

  /**
   * Get day label (e.g., "Today", "Yesterday", "Mon 11/18")
   * @param {Date} date - Date to format
   * @returns {string} Day label
   */
  getDayLabel(date) {
    const today = getToday();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (isSameDay(date, today)) {
      return 'Today';
    } else if (isSameDay(date, yesterday)) {
      return 'Yesterday';
    } else {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = days[date.getDay()];
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${dayName} ${month}/${day}`;
    }
  }

  /**
   * Handle week toggle
   * @param {string} weekLabel - Label of the week to toggle
   */
  handleWeekToggle(weekLabel) {
    if (this.expandedWeeks.has(weekLabel)) {
      this.expandedWeeks.delete(weekLabel);
    } else {
      this.expandedWeeks.add(weekLabel);
    }

    this.renderBreakdown();
  }

  /**
   * Group expenses by category
   * @param {Array} expenses - Expenses to group
   * @returns {Array} Array of category objects
   */
  groupByCategory(expenses) {
    const categories = new Map();
    let totalSpent = 0;

    expenses.forEach(expense => {
      totalSpent += expense.amount;

      if (!Expense.hasCategory(expense)) {
        // No category
        if (!categories.has('uncategorized')) {
          categories.set('uncategorized', {
            type: null,
            label: 'Uncategorized',
            total: 0,
            count: 0
          });
        }
        const cat = categories.get('uncategorized');
        cat.total += expense.amount;
        cat.count++;
      } else {
        const categoryType = expense.category.type;
        const categoryLabel = Expense.getCategoryTypeLabel(categoryType);

        if (!categories.has(categoryType)) {
          categories.set(categoryType, {
            type: categoryType,
            label: categoryLabel,
            total: 0,
            count: 0
          });
        }

        const cat = categories.get(categoryType);
        cat.total += expense.amount;
        cat.count++;
      }
    });

    // Convert to array and add percentages
    const categoryArray = Array.from(categories.values()).map(cat => ({
      ...cat,
      percentage: totalSpent > 0 ? (cat.total / totalSpent) * 100 : 0
    }));

    // Sort by total (descending)
    return categoryArray.sort((a, b) => b.total - a.total);
  }

  /**
   * Get category emoji
   * @param {string} categoryType - Category type
   * @returns {string} Emoji
   */
  getCategoryEmoji(categoryType) {
    const emojis = {
      food: '🍔',
      transportation: '🚗',
      utilities: '💡',
      housing: '🏠',
      entertainment: '🎬',
      medical: '⚕️',
      debt: '💳',
      other: '📦'
    };

    return emojis[categoryType] || '📋';
  }

  /**
   * Render Level 3 - Category breakdown
   */
  renderCategoryBreakdown() {
    const expenses = this.getCycleExpenses();
    const categories = this.groupByCategory(expenses);

    this.categoryBreakdownList.innerHTML = '';

    if (categories.length === 0) {
      this.categoryBreakdownList.innerHTML = '<p class="empty-state">No expenses in this cycle</p>';
      return;
    }

    categories.forEach(category => {
      const categoryItem = document.createElement('div');
      categoryItem.className = 'category-item';

      const emoji = category.type ? this.getCategoryEmoji(category.type) : '📋';

      categoryItem.innerHTML = `
        <div class="category-info">
          <span class="category-emoji">${emoji}</span>
          <span class="category-label">${category.label}</span>
        </div>
        <div class="category-stats">
          <span class="category-total money-value">${formatMoney(category.total)}</span>
          <span class="category-percentage">(${category.percentage.toFixed(0)}%)</span>
        </div>
      `;

      this.categoryBreakdownList.appendChild(categoryItem);
    });
  }

  /**
   * Get filtered and sorted expenses
   * @returns {Array} Filtered and sorted expenses
   */
  getFilteredExpenses() {
    let expenses = this.getCycleExpenses();

    // Apply search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      expenses = expenses.filter(expense =>
        expense.description.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (this.filterCategory) {
      expenses = expenses.filter(expense => {
        if (this.filterCategory === 'uncategorized') {
          return !Expense.hasCategory(expense);
        }
        return expense.category && expense.category.type === this.filterCategory;
      });
    }

    // Apply sort
    switch (this.sortBy) {
      case 'date-desc':
        expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'date-asc':
        expenses.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'amount-desc':
        expenses.sort((a, b) => b.amount - a.amount);
        break;
      case 'amount-asc':
        expenses.sort((a, b) => a.amount - b.amount);
        break;
    }

    return expenses;
  }

  /**
   * Render Level 4 - Full expense list
   */
  renderFullList() {
    const expenses = this.getFilteredExpenses();

    this.expenseListContainer.innerHTML = '';

    if (expenses.length === 0) {
      this.expenseListContainer.innerHTML = '<p class="empty-state">No expenses found</p>';
      return;
    }

    // Group by date
    const groupedByDate = new Map();

    expenses.forEach(expense => {
      const dateKey = formatDate(new Date(expense.date), 'iso');
      if (!groupedByDate.has(dateKey)) {
        groupedByDate.set(dateKey, []);
      }
      groupedByDate.get(dateKey).push(expense);
    });

    // Render each date group
    groupedByDate.forEach((dayExpenses, dateKey) => {
      const date = new Date(dateKey);
      const dayLabel = this.getDayLabel(date);

      const dateHeader = document.createElement('div');
      dateHeader.className = 'expense-date-header';
      dateHeader.textContent = dayLabel;
      this.expenseListContainer.appendChild(dateHeader);

      dayExpenses.forEach(expense => {
        const expenseItem = this.createFullExpenseItem(expense);
        this.expenseListContainer.appendChild(expenseItem);
      });
    });
  }

  /**
   * Create a full expense item element
   * @param {Object} expense - Expense object
   * @returns {HTMLElement} Expense item element
   */
  createFullExpenseItem(expense) {
    const item = document.createElement('div');
    item.className = 'history-expense-item';
    item.setAttribute('data-expense-id', expense.id);

    const categoryLabel = Expense.getCategoryLabel(expense);
    const time = new Date(expense.date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });

    const categoryBadge = categoryLabel
      ? `<span class="expense-category-label">${this.escapeHtml(categoryLabel)}</span>`
      : '';

    item.innerHTML = `
      <div class="expense-main-info">
        <div class="expense-details">
          <p class="expense-description">${this.escapeHtml(expense.description)}</p>
          <div class="expense-meta">
            ${categoryBadge}
            ${categoryBadge ? '<span class="meta-separator">•</span>' : ''}
            <span class="expense-time">${time}</span>
          </div>
        </div>
        <span class="expense-amount money-value">${formatMoney(expense.amount)}</span>
      </div>
      <div class="expense-actions">
        <button class="action-btn delete-btn" data-expense-id="${expense.id}" title="Delete expense">
          🗑️
        </button>
      </div>
    `;

    // Add click handler for delete button
    const deleteBtn = item.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleDeleteExpense(expense.id);
    });

    return item;
  }

  /**
   * Handle search input
   */
  handleSearch() {
    this.searchQuery = this.searchInput.value.trim();
    this.renderFullList();
  }

  /**
   * Handle filter change
   */
  handleFilter() {
    this.filterCategory = this.filterCategorySelect.value;
    this.renderFullList();
  }

  /**
   * Handle sort change
   */
  handleSort() {
    this.sortBy = this.sortSelect.value;
    this.renderFullList();
  }

  /**
   * Handle expense click (future: could open edit modal)
   * @param {string} expenseId - Expense ID
   */
  handleExpenseClick(expenseId) {
    console.log('Expense clicked:', expenseId);
    // Future: Open edit modal
  }

  /**
   * Handle delete expense
   * @param {string} expenseId - Expense ID
   */
  handleDeleteExpense(expenseId) {
    const confirmed = confirm('Are you sure you want to delete this expense?');

    if (confirmed) {
      const success = store.deleteExpense(expenseId);

      if (success) {
        // Refresh the current view
        this.refresh();

        // Emit event
        const event = new CustomEvent('expense-deleted', {
          detail: { expenseId },
          bubbles: true
        });
        document.dispatchEvent(event);
      } else {
        alert('Failed to delete expense. Please try again.');
      }
    }
  }

  /**
   * Handle export to CSV
   */
  handleExportCsv() {
    const expenses = this.getCycleExpenses();

    if (expenses.length === 0) {
      alert('No expenses to export');
      return;
    }

    // Create CSV content
    const headers = ['Date', 'Description', 'Category', 'Amount'];
    const rows = expenses.map(expense => {
      const date = formatDate(new Date(expense.date), 'short');
      const description = expense.description;
      const category = Expense.getCategoryLabel(expense) || 'None';
      const amount = expense.amount.toFixed(2);

      return [date, description, category, amount];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expenses-${formatDate(getToday(), 'iso')}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Singleton instance
let instance = null;

/**
 * Initialize the ExpenseHistory feature
 */
export function initExpenseHistory() {
  if (!instance) {
    instance = new ExpenseHistory();
  }
  return instance;
}

/**
 * Get the ExpenseHistory instance
 */
export function getExpenseHistory() {
  return instance;
}

export default ExpenseHistory;
