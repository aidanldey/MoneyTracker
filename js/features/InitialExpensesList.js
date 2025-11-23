/**
 * Initial Expenses List Manager
 * Daily Budget Tracker
 *
 * Displays and manages initial expenses with payment status tracking.
 * Allows marking as paid, removing unpaid expenses, and adding new ones.
 */

import store from '../state/BudgetStore.js';
import { formatMoney } from '../utils/moneyUtils.js';
import { formatDate } from '../utils/dateUtils.js';

/**
 * InitialExpensesList class manages the initial expenses view
 */
export class InitialExpensesList {
  /**
   * Initialize the InitialExpensesList feature
   */
  constructor() {
    // Container will be created dynamically or found in DOM
    this.container = null;
    this.isVisible = false;

    // Bind methods
    this.handleMarkAsPaid = this.handleMarkAsPaid.bind(this);
    this.handleRemove = this.handleRemove.bind(this);
    this.handleAddNew = this.handleAddNew.bind(this);
    this.handleClose = this.handleClose.bind(this);

    // Listen for initial expense events
    document.addEventListener('initial-expense-added', () => {
      this.refreshList();
    });

    // Listen for state changes
    store.subscribe(() => {
      if (this.isVisible) {
        this.refreshList();
      }
    });
  }

  /**
   * Create the container HTML structure
   * @private
   */
  createContainer() {
    const container = document.createElement('div');
    container.className = 'initial-expenses-container';
    container.setAttribute('hidden', '');
    container.innerHTML = `
      <div class="ie-overlay"></div>
      <div class="ie-panel">
        <header class="ie-header">
          <h2>Initial Expenses</h2>
          <button class="icon-button close-btn" aria-label="Close">✕</button>
        </header>

        <section class="ie-summary">
          <div class="summary-grid">
            <div class="summary-item">
              <span class="label">Fund Balance</span>
              <span class="value money-value fund-balance">$0.00</span>
            </div>
            <div class="summary-item">
              <span class="label">Total Committed</span>
              <span class="value money-value total-committed">$0.00</span>
            </div>
            <div class="summary-item">
              <span class="label">Total Paid</span>
              <span class="value money-value total-paid">$0.00</span>
            </div>
            <div class="summary-item">
              <span class="label">Remaining</span>
              <span class="value money-value remaining">$0.00</span>
            </div>
          </div>
        </section>

        <section class="ie-list">
          <div class="unpaid-section">
            <h3 class="section-header">
              <span>Unpaid</span>
              <span class="count unpaid-count">(0)</span>
            </h3>
            <div class="expense-items" id="unpaid-items"></div>
          </div>

          <div class="paid-section">
            <h3 class="section-header">
              <span>Paid</span>
              <span class="count paid-count">(0)</span>
            </h3>
            <div class="expense-items" id="paid-items"></div>
          </div>
        </section>

        <footer class="ie-footer">
          <button class="btn btn-primary btn-block" id="add-initial-expense-btn">
            + Add Initial Expense
          </button>
        </footer>
      </div>
    `;

    // Add to body
    document.body.appendChild(container);

    // Set up event listeners
    const closeBtn = container.querySelector('.close-btn');
    const overlay = container.querySelector('.ie-overlay');
    const addBtn = container.querySelector('#add-initial-expense-btn');

    closeBtn.addEventListener('click', this.handleClose);
    overlay.addEventListener('click', this.handleClose);
    addBtn.addEventListener('click', this.handleAddNew);

    return container;
  }

  /**
   * Show the initial expenses list
   */
  showList() {
    // Create container if it doesn't exist
    if (!this.container) {
      this.container = this.createContainer();
    }

    // Show container
    this.container.removeAttribute('hidden');
    this.isVisible = true;

    // Render list
    this.render();

    // Emit event
    this.emitEvent('initial-expenses-list-opened');
  }

  /**
   * Hide the initial expenses list
   */
  hideList() {
    if (this.container) {
      this.container.setAttribute('hidden', '');
    }

    this.isVisible = false;

    // Emit event
    this.emitEvent('initial-expenses-list-closed');
  }

  /**
   * Render the entire list
   */
  render() {
    if (!this.container) return;

    // Update summary
    this.updateSummary();

    // Get expenses
    const state = store.getState();
    const unpaid = store.getUnpaidInitialExpenses();
    const paid = store.getPaidInitialExpenses();

    // Update counts
    const unpaidCount = this.container.querySelector('.unpaid-count');
    const paidCount = this.container.querySelector('.paid-count');

    if (unpaidCount) unpaidCount.textContent = `(${unpaid.length})`;
    if (paidCount) paidCount.textContent = `(${paid.length})`;

    // Render unpaid items
    const unpaidContainer = this.container.querySelector('#unpaid-items');
    if (unpaidContainer) {
      if (unpaid.length === 0) {
        unpaidContainer.innerHTML = `
          <div class="empty-state">
            <p>All initial expenses paid! 🎉</p>
          </div>
        `;
      } else {
        unpaidContainer.innerHTML = '';
        unpaid.forEach(expense => {
          const item = this.renderExpenseItem(expense, false);
          unpaidContainer.appendChild(item);
        });
      }
    }

    // Render paid items
    const paidContainer = this.container.querySelector('#paid-items');
    if (paidContainer) {
      if (paid.length === 0) {
        paidContainer.innerHTML = `
          <div class="empty-state">
            <p>No expenses paid yet</p>
          </div>
        `;
      } else {
        paidContainer.innerHTML = '';
        paid.forEach(expense => {
          const item = this.renderExpenseItem(expense, true);
          paidContainer.appendChild(item);
        });
      }
    }

    // Show overall empty state if no expenses at all
    if (unpaid.length === 0 && paid.length === 0) {
      if (unpaidContainer) {
        unpaidContainer.innerHTML = `
          <div class="empty-state">
            <p>No initial expenses. Add your financial obligations to get accurate daily budgets.</p>
          </div>
        `;
      }
      if (paidContainer) {
        paidContainer.innerHTML = '';
      }
    }
  }

  /**
   * Render a single expense item
   * @private
   * @param {Object} expense - Expense object
   * @param {boolean} isPaid - Whether expense is paid
   * @returns {HTMLElement} Expense item element
   */
  renderExpenseItem(expense, isPaid) {
    const item = document.createElement('article');
    item.className = `expense-item ${isPaid ? 'paid' : 'unpaid'}`;
    item.setAttribute('data-expense-id', expense.id);

    // Checkbox/checkmark
    const checkbox = isPaid ? '✓' : '☐';

    // Category badge
    const categoryBadge = expense.category
      ? `<span class="category-badge">${expense.category}</span>`
      : '';

    // Paid date
    const paidDateText = isPaid && expense.paidDate
      ? `<p class="paid-date">Paid on ${formatDate(expense.paidDate, 'short')}</p>`
      : '';

    // Notes
    const notesText = expense.notes
      ? `<p class="expense-notes">${this.escapeHtml(expense.notes)}</p>`
      : '';

    item.innerHTML = `
      <div class="expense-checkbox">
        <span class="checkbox-icon">${checkbox}</span>
      </div>
      <div class="expense-details">
        <h4 class="expense-description">${this.escapeHtml(expense.description)}</h4>
        ${categoryBadge}
        <p class="expense-amount money-value">${formatMoney(expense.amount)}</p>
        ${paidDateText}
        ${notesText}
      </div>
      <div class="expense-actions">
        ${!isPaid ? `
          <button
            class="btn btn-small btn-success mark-paid-btn"
            data-expense-id="${expense.id}"
            aria-label="Mark ${this.escapeHtml(expense.description)} as paid">
            Mark Paid
          </button>
          <button
            class="btn btn-small btn-danger remove-btn"
            data-expense-id="${expense.id}"
            aria-label="Remove ${this.escapeHtml(expense.description)}">
            Remove
          </button>
        ` : ''}
      </div>
    `;

    // Add event listeners
    if (!isPaid) {
      const markPaidBtn = item.querySelector('.mark-paid-btn');
      const removeBtn = item.querySelector('.remove-btn');

      if (markPaidBtn) {
        markPaidBtn.addEventListener('click', () => this.handleMarkAsPaid(expense.id, expense.description));
      }

      if (removeBtn) {
        removeBtn.addEventListener('click', () => this.handleRemove(expense.id, expense.description, expense.amount));
      }
    }

    return item;
  }

  /**
   * Update summary display
   */
  updateSummary() {
    if (!this.container) return;

    const state = store.getState();
    const { fund, totalCommitted, totalPaid } = state.initialExpenses;
    const remaining = fund;

    // Update summary values
    const fundBalance = this.container.querySelector('.fund-balance');
    const totalCommittedEl = this.container.querySelector('.total-committed');
    const totalPaidEl = this.container.querySelector('.total-paid');
    const remainingEl = this.container.querySelector('.remaining');

    if (fundBalance) fundBalance.textContent = formatMoney(fund);
    if (totalCommittedEl) totalCommittedEl.textContent = formatMoney(totalCommitted);
    if (totalPaidEl) totalPaidEl.textContent = formatMoney(totalPaid);
    if (remainingEl) remainingEl.textContent = formatMoney(remaining);
  }

  /**
   * Handle mark as paid action
   * @private
   * @param {string} expenseId - Expense ID
   * @param {string} description - Expense description
   */
  handleMarkAsPaid(expenseId, description) {
    // Show confirmation
    const confirmed = confirm(`Mark "${description}" as paid?`);

    if (!confirmed) return;

    // Mark as paid
    const success = store.markInitialExpenseAsPaid(expenseId);

    if (success) {
      // Show success message
      this.showSuccessMessage('Marked as paid!');

      // Refresh list
      this.refreshList();
    } else {
      alert('Failed to mark expense as paid. Please try again.');
    }
  }

  /**
   * Handle remove expense action
   * @private
   * @param {string} expenseId - Expense ID
   * @param {string} description - Expense description
   * @param {number} amount - Expense amount
   */
  handleRemove(expenseId, description, amount) {
    // Show confirmation
    const confirmed = confirm(
      `Remove "${description}"?\n\n${formatMoney(amount)} will be added back to your available balance.`
    );

    if (!confirmed) return;

    // Remove expense
    const success = store.removeInitialExpense(expenseId);

    if (success) {
      // Show success message
      this.showSuccessMessage('Expense removed!');

      // Refresh list
      this.refreshList();
    } else {
      alert('Failed to remove expense. Please try again.');
    }
  }

  /**
   * Handle add new expense
   * @private
   */
  handleAddNew() {
    // Emit event to open InitialExpensesForm
    this.emitEvent('open-initial-expense-form');

    // Or directly trigger if InitialExpensesForm is available
    const addEvent = new CustomEvent('click', { bubbles: true });
    const addBtn = document.querySelector('[data-action="add-initial-expense"]');

    if (addBtn) {
      addBtn.dispatchEvent(addEvent);
    } else {
      // Create temporary trigger
      const trigger = document.createElement('button');
      trigger.setAttribute('data-action', 'add-initial-expense');
      trigger.style.display = 'none';
      document.body.appendChild(trigger);
      trigger.click();
      document.body.removeChild(trigger);
    }
  }

  /**
   * Handle close
   * @private
   */
  handleClose() {
    this.hideList();
  }

  /**
   * Refresh the list
   */
  refreshList() {
    if (this.isVisible) {
      this.render();
    }
  }

  /**
   * Show success message (temporary toast)
   * @private
   * @param {string} message - Success message
   */
  showSuccessMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: var(--spacing-xl);
      right: var(--spacing-xl);
      background: var(--color-status-good);
      color: white;
      padding: var(--spacing-lg);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
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
   * Emit a custom event
   * @private
   * @param {string} eventName - Name of the event
   * @param {Object} detail - Event detail data
   */
  emitEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true
    });
    document.dispatchEvent(event);
  }
}

// Export singleton instance
export default new InitialExpensesList();
