/**
 * Pay Period Manager Feature
 * Daily Budget Tracker
 *
 * Handles transitions between pay periods with archive options.
 * Allows users to archive, clear, or continue with current data.
 */

import store from '../state/BudgetStore.js';
import Expense from '../models/Expense.js';
import { formatMoney } from '../utils/moneyUtils.js';
import { formatDate, getToday, getDaysUntil } from '../utils/dateUtils.js';

/**
 * PayPeriodManager class manages pay period transitions
 */
export class PayPeriodManager {
  constructor() {
    // Get DOM elements
    this.transitionModal = document.getElementById('pay-period-transition-modal');
    this.archiveViewerModal = document.getElementById('archive-viewer-modal');

    if (this.transitionModal) {
      this.transitionOverlay = this.transitionModal.querySelector('.modal-overlay');
      this.closeButtons = this.transitionModal.querySelectorAll('[data-action="close-modal"]');

      // Transition modal elements
      this.periodSummaryEl = document.getElementById('period-summary');
      this.archiveStartBtn = document.getElementById('archive-start-btn');
      this.clearStartBtn = document.getElementById('clear-start-btn');
      this.continueDataBtn = document.getElementById('continue-data-btn');
      this.keepSavingsCheckbox = document.getElementById('keep-savings-checkbox');
    }

    if (this.archiveViewerModal) {
      this.archiveOverlay = this.archiveViewerModal.querySelector('.modal-overlay');
      this.archiveCloseButtons = this.archiveViewerModal.querySelectorAll('[data-action="close-modal"]');

      // Archive viewer elements
      this.archiveListEl = document.getElementById('archive-list');
      this.archiveDetailEl = document.getElementById('archive-detail');
      this.backToArchiveListBtn = document.getElementById('back-to-archive-list-btn');
      this.exportArchiveBtn = document.getElementById('export-archive-btn');
    }

    // State
    this.currentArchiveId = null;

    // Bind methods
    this.openTransitionModal = this.openTransitionModal.bind(this);
    this.closeTransitionModal = this.closeTransitionModal.bind(this);
    this.handleArchiveAndStart = this.handleArchiveAndStart.bind(this);
    this.handleClearAndStart = this.handleClearAndStart.bind(this);
    this.handleContinue = this.handleContinue.bind(this);
    this.openArchiveViewer = this.openArchiveViewer.bind(this);
    this.closeArchiveViewer = this.closeArchiveViewer.bind(this);
    this.viewArchiveDetail = this.viewArchiveDetail.bind(this);
    this.exportArchive = this.exportArchive.bind(this);

    // Initialize event listeners
    this.initEventListeners();
  }

  /**
   * Initialize event listeners
   */
  initEventListeners() {
    if (this.transitionModal) {
      // Close buttons
      this.closeButtons?.forEach(button => {
        button.addEventListener('click', this.closeTransitionModal);
      });

      // Overlay click
      this.transitionOverlay?.addEventListener('click', this.closeTransitionModal);

      // Option buttons
      this.archiveStartBtn?.addEventListener('click', this.handleArchiveAndStart);
      this.clearStartBtn?.addEventListener('click', this.handleClearAndStart);
      this.continueDataBtn?.addEventListener('click', this.handleContinue);
    }

    if (this.archiveViewerModal) {
      // Close buttons
      this.archiveCloseButtons?.forEach(button => {
        button.addEventListener('click', this.closeArchiveViewer);
      });

      // Overlay click
      this.archiveOverlay?.addEventListener('click', this.closeArchiveViewer);

      // Back button
      this.backToArchiveListBtn?.addEventListener('click', () => {
        this.showArchiveList();
      });

      // Export button
      this.exportArchiveBtn?.addEventListener('click', this.exportArchive);
    }

    // Listen for manual trigger
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="start-new-period"]')) {
        this.openTransitionModal();
      }
      if (e.target.matches('[data-action="view-archives"]')) {
        this.openArchiveViewer();
      }
    });
  }

  /**
   * Check if period is ending soon
   * @returns {boolean} True if period ends in 1 day or less
   */
  shouldShowTransitionPrompt() {
    const state = store.getState();

    if (!state.budget.cycleEndDate) {
      return false;
    }

    const daysRemaining = getDaysUntil(state.budget.cycleEndDate);
    return daysRemaining <= 1;
  }

  /**
   * Open transition modal
   */
  openTransitionModal() {
    if (!this.transitionModal) return;

    const state = store.getState();

    // Calculate summary
    const summary = this.calculatePeriodSummary(state);

    // Render summary
    this.renderPeriodSummary(summary);

    // Show modal
    this.transitionModal.removeAttribute('hidden');
  }

  /**
   * Close transition modal
   */
  closeTransitionModal() {
    if (!this.transitionModal) return;
    this.transitionModal.setAttribute('hidden', '');
  }

  /**
   * Calculate period summary
   * @param {Object} state - Current state
   * @returns {Object} Summary data
   */
  calculatePeriodSummary(state) {
    const totalSpent = state.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const saved = state.budget.savingsFund || 0;
    const remaining = state.budget.currentBalance || 0;

    const startDate = state.budget.cycleStartDate
      ? new Date(state.budget.cycleStartDate)
      : null;
    const endDate = state.budget.cycleEndDate
      ? new Date(state.budget.cycleEndDate)
      : null;

    const daysInCycle = startDate && endDate
      ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
      : 0;

    return {
      income: state.income.amount || 0,
      totalSpent,
      saved,
      remaining,
      daysInCycle,
      expenseCount: state.expenses.length,
      startDate,
      endDate
    };
  }

  /**
   * Render period summary
   * @param {Object} summary - Summary data
   */
  renderPeriodSummary(summary) {
    if (!this.periodSummaryEl) return;

    const startStr = summary.startDate
      ? formatDate(summary.startDate, 'short')
      : 'N/A';
    const endStr = summary.endDate
      ? formatDate(summary.endDate, 'short')
      : 'N/A';

    this.periodSummaryEl.innerHTML = `
      <div class="summary-row">
        <span class="summary-label">Period:</span>
        <span class="summary-value">${startStr} - ${endStr}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Days in cycle:</span>
        <span class="summary-value">${summary.daysInCycle}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Income:</span>
        <span class="summary-value money-value">${formatMoney(summary.income)}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Total spent:</span>
        <span class="summary-value money-value">${formatMoney(summary.totalSpent)}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Savings fund:</span>
        <span class="summary-value money-value">${formatMoney(summary.saved)}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Remaining balance:</span>
        <span class="summary-value money-value">${formatMoney(summary.remaining)}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Expenses logged:</span>
        <span class="summary-value">${summary.expenseCount}</span>
      </div>
    `;
  }

  /**
   * Calculate category breakdown
   * @param {Array} expenses - Expenses array
   * @returns {Object} Category breakdown
   */
  calculateCategoryBreakdown(expenses) {
    const breakdown = {};

    expenses.forEach(expense => {
      if (!Expense.hasCategory(expense)) {
        breakdown.uncategorized = (breakdown.uncategorized || 0) + expense.amount;
      } else {
        const type = expense.category.type;
        breakdown[type] = (breakdown[type] || 0) + expense.amount;
      }
    });

    return breakdown;
  }

  /**
   * Create archive from current state
   * @param {boolean} keepSavings - Whether to keep savings in archive
   * @returns {Object} Archive object
   */
  createArchive(keepSavings = false) {
    const state = store.getState();
    const summary = this.calculatePeriodSummary(state);
    const categoryBreakdown = this.calculateCategoryBreakdown(state.expenses);

    return {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      period: {
        start: state.budget.cycleStartDate,
        end: state.budget.cycleEndDate
      },
      summary: {
        income: summary.income,
        totalSpent: summary.totalSpent,
        saved: keepSavings ? summary.saved : 0,
        remaining: summary.remaining,
        daysInCycle: summary.daysInCycle,
        expenseCount: summary.expenseCount
      },
      expenses: [...state.expenses],
      categoryBreakdown,
      savingsFund: keepSavings ? state.budget.savingsFund : 0,
      savingsHistory: keepSavings ? [...(state.savingsHistory || [])] : []
    };
  }

  /**
   * Handle archive and start fresh
   */
  handleArchiveAndStart() {
    const keepSavings = this.keepSavingsCheckbox?.checked || false;

    // Create archive
    const archive = this.createArchive(keepSavings);

    // Add archive to store
    store.addArchive(archive);

    // Get current state for preserving settings
    const state = store.getState();

    // Reset the budget while preserving income and recurring expenses
    store.setState({
      expenses: [],
      budget: {
        ...state.budget,
        currentBalance: state.income.amount || 0,
        todaySpent: 0,
        savingsFund: keepSavings ? state.budget.savingsFund : 0
      },
      savingsHistory: keepSavings ? state.savingsHistory : []
    });

    // Recalculate with recurring expenses
    store.applyRecurringExpenses();

    // Close modal
    this.closeTransitionModal();

    // Show success message
    this.showSuccessMessage(`Period archived successfully! ${keepSavings ? 'Savings preserved.' : 'Starting fresh.'}`);

    // Refresh dashboard
    document.dispatchEvent(new CustomEvent('budget-updated'));
  }

  /**
   * Handle clear and start fresh
   */
  handleClearAndStart() {
    const confirmed = confirm(
      'Are you sure you want to clear all data without archiving?\n\n' +
      'This will permanently delete:\n' +
      '- All expenses\n' +
      '- Savings fund\n' +
      '- Savings history\n\n' +
      'Income settings and recurring expenses will be preserved.'
    );

    if (!confirmed) return;

    // Get current state for preserving settings
    const state = store.getState();

    // Reset without creating archive
    store.setState({
      expenses: [],
      budget: {
        ...state.budget,
        currentBalance: state.income.amount || 0,
        todaySpent: 0,
        savingsFund: 0
      },
      savingsHistory: []
    });

    // Recalculate with recurring expenses
    store.applyRecurringExpenses();

    // Close modal
    this.closeTransitionModal();

    // Show success message
    this.showSuccessMessage('Data cleared. Starting fresh!');

    // Refresh dashboard
    document.dispatchEvent(new CustomEvent('budget-updated'));
  }

  /**
   * Handle continue with current data
   */
  handleContinue() {
    // Just update the cycle dates
    const state = store.getState();

    if (state.income.frequency && state.income.frequency !== 'one-time') {
      // Trigger payday rollover
      store.checkAndHandlePayday();
    } else {
      // Manual date update - just extend the cycle
      const today = getToday();
      const newEndDate = new Date(today);
      newEndDate.setDate(newEndDate.getDate() + 14); // Default 14 days

      store.setState({
        budget: {
          ...state.budget,
          cycleStartDate: today.toISOString(),
          cycleEndDate: newEndDate.toISOString(),
          daysRemaining: 14
        }
      });
    }

    // Close modal
    this.closeTransitionModal();

    // Show success message
    this.showSuccessMessage('Continuing with current data. Dates updated.');

    // Refresh dashboard
    document.dispatchEvent(new CustomEvent('budget-updated'));
  }

  /**
   * Show success message
   * @param {string} message - Message to show
   */
  showSuccessMessage(message) {
    // Create temporary message element
    const messageEl = document.createElement('div');
    messageEl.className = 'success-toast';
    messageEl.textContent = message;
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: var(--color-status-good);
      color: white;
      padding: var(--spacing-md) var(--spacing-xl);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      z-index: 10000;
      animation: slideDown 0.3s ease;
    `;

    document.body.appendChild(messageEl);

    // Remove after 3 seconds
    setTimeout(() => {
      messageEl.style.animation = 'slideUp 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(messageEl);
      }, 300);
    }, 3000);
  }

  /**
   * Open archive viewer
   */
  openArchiveViewer() {
    if (!this.archiveViewerModal) return;

    this.showArchiveList();
    this.archiveViewerModal.removeAttribute('hidden');
  }

  /**
   * Close archive viewer
   */
  closeArchiveViewer() {
    if (!this.archiveViewerModal) return;
    this.archiveViewerModal.setAttribute('hidden', '');
  }

  /**
   * Show archive list
   */
  showArchiveList() {
    if (!this.archiveListEl || !this.archiveDetailEl) return;

    this.archiveListEl.style.display = 'block';
    this.archiveDetailEl.style.display = 'none';

    this.renderArchiveList();
  }

  /**
   * Render archive list
   */
  renderArchiveList() {
    if (!this.archiveListEl) return;

    const state = store.getState();
    const archives = state.archives || [];

    if (archives.length === 0) {
      this.archiveListEl.innerHTML = '<p class="empty-state">No archived pay periods yet</p>';
      return;
    }

    // Sort by most recent first
    const sortedArchives = [...archives].sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    this.archiveListEl.innerHTML = '';

    sortedArchives.forEach(archive => {
      const archiveItem = this.createArchiveItem(archive);
      this.archiveListEl.appendChild(archiveItem);
    });
  }

  /**
   * Create archive list item
   * @param {Object} archive - Archive data
   * @returns {HTMLElement} Archive item element
   */
  createArchiveItem(archive) {
    const item = document.createElement('div');
    item.className = 'archive-item';

    const startDate = new Date(archive.period.start);
    const endDate = new Date(archive.period.end);

    item.innerHTML = `
      <div class="archive-header">
        <h3 class="archive-title">
          ${formatDate(startDate, 'short')} - ${formatDate(endDate, 'short')}
        </h3>
        <button class="btn-icon" data-archive-id="${archive.id}" title="View details">
          →
        </button>
      </div>
      <div class="archive-summary-grid">
        <div class="archive-stat">
          <span class="stat-label">Spent</span>
          <span class="stat-value money-value">${formatMoney(archive.summary.totalSpent)}</span>
        </div>
        <div class="archive-stat">
          <span class="stat-label">Saved</span>
          <span class="stat-value money-value">${formatMoney(archive.summary.saved)}</span>
        </div>
        <div class="archive-stat">
          <span class="stat-label">Expenses</span>
          <span class="stat-value">${archive.summary.expenseCount}</span>
        </div>
      </div>
    `;

    // Add click handler for view button
    const viewBtn = item.querySelector('[data-archive-id]');
    viewBtn.addEventListener('click', () => {
      this.viewArchiveDetail(archive.id);
    });

    return item;
  }

  /**
   * View archive detail
   * @param {string} archiveId - Archive ID
   */
  viewArchiveDetail(archiveId) {
    if (!this.archiveDetailEl) return;

    const state = store.getState();
    const archive = state.archives?.find(a => a.id === archiveId);

    if (!archive) {
      console.error('Archive not found:', archiveId);
      return;
    }

    this.currentArchiveId = archiveId;

    // Hide list, show detail
    this.archiveListEl.style.display = 'none';
    this.archiveDetailEl.style.display = 'block';

    // Render detail
    this.renderArchiveDetail(archive);
  }

  /**
   * Render archive detail
   * @param {Object} archive - Archive data
   */
  renderArchiveDetail(archive) {
    if (!this.archiveDetailEl) return;

    const startDate = new Date(archive.period.start);
    const endDate = new Date(archive.period.end);

    // Calculate category stats
    const categoryStats = Object.entries(archive.categoryBreakdown || {})
      .map(([type, amount]) => ({
        type,
        label: type === 'uncategorized' ? 'Uncategorized' : Expense.getCategoryTypeLabel(type),
        amount,
        percentage: (amount / archive.summary.totalSpent) * 100
      }))
      .sort((a, b) => b.amount - a.amount);

    const categoryHtml = categoryStats.length > 0
      ? categoryStats.map(cat => `
          <div class="category-stat-row">
            <span class="category-name">${cat.label}</span>
            <div class="category-bar-container">
              <div class="category-bar" style="width: ${cat.percentage}%"></div>
            </div>
            <span class="category-amount money-value">${formatMoney(cat.amount)}</span>
            <span class="category-percent">${cat.percentage.toFixed(0)}%</span>
          </div>
        `).join('')
      : '<p class="empty-state">No category data</p>';

    // Recent expenses
    const recentExpenses = archive.expenses
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    const expensesHtml = recentExpenses.length > 0
      ? recentExpenses.map(expense => {
          const categoryLabel = Expense.getCategoryLabel(expense);
          return `
            <div class="archive-expense-item">
              <div class="expense-info">
                <span class="expense-desc">${this.escapeHtml(expense.description)}</span>
                ${categoryLabel ? `<span class="expense-cat">${this.escapeHtml(categoryLabel)}</span>` : ''}
              </div>
              <span class="expense-amt money-value">${formatMoney(expense.amount)}</span>
            </div>
          `;
        }).join('')
      : '<p class="empty-state">No expenses</p>';

    this.archiveDetailEl.innerHTML = `
      <h3 class="archive-detail-title">
        ${formatDate(startDate, 'long')} - ${formatDate(endDate, 'long')}
      </h3>

      <div class="archive-detail-summary">
        <div class="summary-stat">
          <span class="stat-label">Income</span>
          <span class="stat-value money-value">${formatMoney(archive.summary.income)}</span>
        </div>
        <div class="summary-stat">
          <span class="stat-label">Total Spent</span>
          <span class="stat-value money-value">${formatMoney(archive.summary.totalSpent)}</span>
        </div>
        <div class="summary-stat">
          <span class="stat-label">Saved</span>
          <span class="stat-value money-value">${formatMoney(archive.summary.saved)}</span>
        </div>
        <div class="summary-stat">
          <span class="stat-label">Days</span>
          <span class="stat-value">${archive.summary.daysInCycle}</span>
        </div>
      </div>

      <h4 class="section-title">Category Breakdown</h4>
      <div class="category-stats">
        ${categoryHtml}
      </div>

      <h4 class="section-title">Recent Expenses (Top 10)</h4>
      <div class="archive-expenses-list">
        ${expensesHtml}
      </div>
    `;
  }

  /**
   * Export archive to CSV
   */
  exportArchive() {
    if (!this.currentArchiveId) {
      alert('No archive selected');
      return;
    }

    const state = store.getState();
    const archive = state.archives?.find(a => a.id === this.currentArchiveId);

    if (!archive) {
      alert('Archive not found');
      return;
    }

    // Create CSV content
    const headers = ['Date', 'Description', 'Category', 'Amount'];
    const rows = archive.expenses.map(expense => {
      const date = formatDate(new Date(expense.date), 'short');
      const description = expense.description;
      const category = Expense.getCategoryLabel(expense) || 'None';
      const amount = expense.amount.toFixed(2);

      return [date, description, category, amount];
    });

    const csvContent = [
      `Archive: ${formatDate(new Date(archive.period.start), 'short')} - ${formatDate(new Date(archive.period.end), 'short')}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `archive-${archive.id}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Escape HTML
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
 * Initialize PayPeriodManager
 */
export function initPayPeriodManager() {
  if (!instance) {
    instance = new PayPeriodManager();
  }
  return instance;
}

/**
 * Get PayPeriodManager instance
 */
export function getPayPeriodManager() {
  return instance;
}

export default PayPeriodManager;
