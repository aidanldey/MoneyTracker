/**
 * Income Setup Feature
 * Daily Budget Tracker
 *
 * Multi-step wizard for income and initial expenses setup.
 * Step 1: Income amount and duration
 * Step 2: Initial expenses (bills, rent, etc.)
 * Step 3: Review and confirmation
 */

import store from '../state/BudgetStore.js';
import { getToday, addDays, formatDate } from '../utils/dateUtils.js';
import { parseMoney, validateAmount, formatMoney } from '../utils/moneyUtils.js';
import initialExpensesForm from './InitialExpensesForm.js';

/**
 * IncomeSetup class manages the multi-step income configuration wizard
 */
export class IncomeSetup {
  /**
   * Initialize the IncomeSetup feature
   */
  constructor() {
    // Get DOM elements
    this.modal = document.getElementById('income-modal');
    this.modalContent = this.modal.querySelector('.modal-content');

    // Wizard state
    this.currentStep = 1;
    this.totalSteps = 3;
    this.incomeData = null;
    this.initialExpenses = [];

    // Bind methods
    this.handleStep1Submit = this.handleStep1Submit.bind(this);
    this.handleStep2Next = this.handleStep2Next.bind(this);
    this.handleStep2Skip = this.handleStep2Skip.bind(this);
    this.handleStep3Submit = this.handleStep3Submit.bind(this);
    this.handleBack = this.handleBack.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleAddExpense = this.handleAddExpense.bind(this);
    this.handleRemoveExpense = this.handleRemoveExpense.bind(this);

    // Listen for initial expense events
    document.addEventListener('initial-expense-added', (e) => {
      if (this.currentStep === 2 && this.modal && !this.modal.hasAttribute('hidden')) {
        // Add to temporary array
        const expense = e.detail;
        this.initialExpenses.push({
          description: expense.description,
          amount: expense.amount,
          category: expense.category || null,
          notes: expense.notes || ''
        });

        // Re-render step 2 to show new expense
        this.renderStep2();
      }
    });

    // Listen for manage income button clicks
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="manage-income"]')) {
        this.showModal();
      }
    });

    // Check if first time user (no income set)
    this.checkFirstTimeUser();
  }

  /**
   * Check if this is a first-time user and auto-open modal
   * @private
   */
  checkFirstTimeUser() {
    const state = store.getState();

    // If no income has been set up, show the modal
    if (state.income.amount === 0) {
      setTimeout(() => {
        this.showModal(true);
      }, 100);
    }
  }

  /**
   * Show the income setup modal
   * @param {boolean} isFirstTime - Whether this is first-time setup
   */
  showModal(isFirstTime = false) {
    // Reset wizard state
    this.currentStep = 1;
    this.incomeData = null;
    this.initialExpenses = [];

    // Check if editing existing income
    const state = store.getState();
    const isEditing = state.income.amount > 0;

    // Render step 1
    this.renderStep1(isFirstTime, isEditing);

    // Show modal
    this.modal.removeAttribute('hidden');

    // Emit event
    this.emitEvent('income-modal-opened');
  }

  /**
   * Hide the income setup modal
   */
  hideModal() {
    this.modal.setAttribute('hidden', '');

    // Reset state
    this.currentStep = 1;
    this.incomeData = null;
    this.initialExpenses = [];

    // Disable wizard mode in InitialExpensesForm
    if (initialExpensesForm) {
      initialExpensesForm.wizardMode = false;
      initialExpensesForm.wizardIncome = 0;
    }

    // Emit event
    this.emitEvent('income-modal-closed');
  }

  /**
   * Render Step 1: Income Setup
   * @private
   */
  renderStep1(isFirstTime = false, isEditing = false) {
    const state = store.getState();
    const existingAmount = isEditing ? state.income.amount : '';
    const existingDays = isEditing ? state.income.daysToLast : '';

    const title = isFirstTime
      ? "Let's Start by Setting Up Your Income"
      : isEditing
        ? 'Update Income'
        : 'Set Up Your Income';

    this.modalContent.innerHTML = `
      <div class="modal-header">
        <h2 class="modal-title">${title}</h2>
        <span class="step-indicator">[1/${this.totalSteps}]</span>
      </div>

      <div class="modal-body">
        <form id="income-step1-form">
          <div class="form-group">
            <label for="income-amount">Income Amount</label>
            <input
              type="number"
              id="income-amount"
              name="amount"
              placeholder="0.00"
              step="0.01"
              min="0.01"
              value="${existingAmount}"
              required
              autofocus>
          </div>

          <div class="form-group">
            <label for="income-days">Days to Last</label>
            <input
              type="number"
              id="income-days"
              name="days"
              placeholder="14"
              min="1"
              max="365"
              value="${existingDays}"
              required>
          </div>

          <div class="modal-actions">
            <button
              type="button"
              class="btn btn-secondary"
              id="cancel-btn">
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary">
              Next: Add Obligations →
            </button>
          </div>
        </form>
      </div>
    `;

    // Set up event listeners
    const form = document.getElementById('income-step1-form');
    const cancelBtn = document.getElementById('cancel-btn');

    form.addEventListener('submit', this.handleStep1Submit);
    cancelBtn.addEventListener('click', this.handleCancel);

    // Focus on first input
    setTimeout(() => {
      document.getElementById('income-amount').focus();
    }, 100);
  }

  /**
   * Render Step 2: Initial Expenses
   * @private
   */
  renderStep2() {
    // Enable wizard mode in InitialExpensesForm
    if (initialExpensesForm) {
      initialExpensesForm.wizardMode = true;
      initialExpensesForm.wizardIncome = this.incomeData.amount;
    }

    const totalExpenses = this.initialExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const availableAfterExpenses = this.incomeData.amount - totalExpenses;

    const expenseListHTML = this.initialExpenses.length === 0
      ? '<p class="empty-state">No initial expenses added yet. Skip this step if you don\'t have any.</p>'
      : this.initialExpenses.map((expense, index) => `
          <div class="temp-expense-item" data-index="${index}">
            <div class="temp-expense-info">
              <p class="temp-expense-description">${this.escapeHtml(expense.description)}</p>
              ${expense.category ? `<span class="category-badge">${expense.category}</span>` : ''}
              <p class="temp-expense-amount money-value">${formatMoney(expense.amount)}</p>
            </div>
            <button
              type="button"
              class="btn btn-small btn-danger"
              data-index="${index}"
              data-action="remove-temp-expense">
              Remove
            </button>
          </div>
        `).join('');

    this.modalContent.innerHTML = `
      <div class="modal-header">
        <h2 class="modal-title">Initial Expenses</h2>
        <span class="step-indicator">[2/${this.totalSteps}]</span>
      </div>

      <div class="modal-body">
        <div class="step-description">
          <p>Add your financial obligations (bills, rent, subscriptions, etc.)</p>
          <p class="help-text">These will be reserved from your available balance to ensure you don't overspend.</p>
        </div>

        <div class="temp-expenses-list">
          ${expenseListHTML}
        </div>

        <button
          type="button"
          class="btn btn-secondary btn-block"
          id="add-expense-btn"
          data-action="add-initial-expense">
          + Add Initial Expense
        </button>

        <div class="step2-summary">
          <h3>Summary</h3>
          <div class="summary-row">
            <span>Income:</span>
            <span class="money-value">${formatMoney(this.incomeData.amount)}</span>
          </div>
          <div class="summary-row">
            <span>Initial Expenses:</span>
            <span class="money-value">${formatMoney(totalExpenses)}</span>
          </div>
          <div class="summary-row total">
            <span>Available:</span>
            <span class="money-value ${availableAfterExpenses < 0 ? 'negative' : ''}">${formatMoney(availableAfterExpenses)}</span>
          </div>
          ${availableAfterExpenses < 0 ? '<p class="warning-text">⚠️ Your expenses exceed your income!</p>' : ''}
        </div>

        <div class="modal-actions">
          <button
            type="button"
            class="btn btn-secondary"
            id="back-btn">
            ← Back
          </button>
          <button
            type="button"
            class="btn btn-secondary"
            id="skip-btn">
            Skip
          </button>
          <button
            type="button"
            class="btn btn-primary"
            id="next-btn"
            ${availableAfterExpenses < 0 ? 'disabled' : ''}>
            Next: Review →
          </button>
        </div>
      </div>
    `;

    // Set up event listeners
    const backBtn = document.getElementById('back-btn');
    const skipBtn = document.getElementById('skip-btn');
    const nextBtn = document.getElementById('next-btn');
    const removeButtons = document.querySelectorAll('[data-action="remove-temp-expense"]');

    backBtn.addEventListener('click', this.handleBack);
    skipBtn.addEventListener('click', this.handleStep2Skip);
    nextBtn.addEventListener('click', this.handleStep2Next);

    removeButtons.forEach(btn => {
      btn.addEventListener('click', this.handleRemoveExpense);
    });
  }

  /**
   * Render Step 3: Review and Confirm
   * @private
   */
  renderStep3() {
    const totalExpenses = this.initialExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const availableBalance = this.incomeData.amount - totalExpenses;
    const dailyBudget = this.incomeData.days > 0
      ? availableBalance / this.incomeData.days
      : 0;

    const endDate = addDays(this.incomeData.startDate, this.incomeData.days);

    const expensesListHTML = this.initialExpenses.length === 0
      ? '<p class="empty-state">No initial expenses</p>'
      : this.initialExpenses.map(expense => `
          <div class="review-expense-item">
            <span>• ${this.escapeHtml(expense.description)}</span>
            <span class="money-value">${formatMoney(expense.amount)}</span>
          </div>
        `).join('');

    this.modalContent.innerHTML = `
      <div class="modal-header">
        <h2 class="modal-title">Review & Confirm</h2>
        <span class="step-indicator">[3/${this.totalSteps}]</span>
      </div>

      <div class="modal-body">
        <div class="review-section">
          <h3>Pay Period</h3>
          <p><strong>${this.incomeData.days}</strong> days</p>
          <p class="help-text">Ends: ${formatDate(endDate, 'long')}</p>
        </div>

        <div class="review-section">
          <h3>Budget Breakdown</h3>
          <div class="breakdown-row">
            <span>Starting Balance:</span>
            <span class="money-value">${formatMoney(this.incomeData.amount)}</span>
          </div>
          <div class="breakdown-row">
            <span>Initial Expenses:</span>
            <span class="money-value">${formatMoney(totalExpenses)}</span>
          </div>
          <div class="breakdown-row total">
            <span>Available Balance:</span>
            <span class="money-value">${formatMoney(availableBalance)}</span>
          </div>
        </div>

        <div class="review-section highlight">
          <h3>Your Daily Budget</h3>
          <p class="daily-budget-preview money-value">${formatMoney(dailyBudget)}</p>
          <p class="help-text">(Available Balance ÷ ${this.incomeData.days} days)</p>
        </div>

        ${this.initialExpenses.length > 0 ? `
          <div class="review-section">
            <h3>Initial Expenses (${this.initialExpenses.length})</h3>
            <div class="review-expenses-list">
              ${expensesListHTML}
            </div>
          </div>
        ` : ''}

        <div class="modal-actions">
          <button
            type="button"
            class="btn btn-secondary"
            id="back-btn">
            ← Back
          </button>
          <button
            type="button"
            class="btn btn-primary"
            id="start-tracking-btn">
            Start Tracking
          </button>
        </div>
      </div>
    `;

    // Set up event listeners
    const backBtn = document.getElementById('back-btn');
    const startBtn = document.getElementById('start-tracking-btn');

    backBtn.addEventListener('click', this.handleBack);
    startBtn.addEventListener('click', this.handleStep3Submit);
  }

  /**
   * Handle Step 1 form submission
   * @private
   */
  handleStep1Submit(e) {
    e.preventDefault();

    const amountInput = document.getElementById('income-amount');
    const daysInput = document.getElementById('income-days');

    const amount = parseMoney(amountInput.value);
    const days = parseInt(daysInput.value, 10);

    // Validate
    if (!validateAmount(amount) || amount <= 0) {
      alert('Please enter a valid income amount greater than $0.');
      amountInput.focus();
      return;
    }

    if (isNaN(days) || days < 1 || days > 365) {
      alert('Please enter a valid number of days (1-365).');
      daysInput.focus();
      return;
    }

    // Store income data temporarily
    this.incomeData = {
      amount,
      days,
      startDate: getToday()
    };

    // Go to step 2
    this.currentStep = 2;
    this.renderStep2();
  }

  /**
   * Handle Step 2 Next button
   * @private
   */
  handleStep2Next() {
    // Validate that expenses don't exceed income
    const totalExpenses = this.initialExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    if (totalExpenses > this.incomeData.amount) {
      alert('Your initial expenses exceed your income. Please adjust before continuing.');
      return;
    }

    // Go to step 3
    this.currentStep = 3;
    this.renderStep3();
  }

  /**
   * Handle Step 2 Skip button
   * @private
   */
  handleStep2Skip() {
    // Clear expenses and go to step 3
    this.initialExpenses = [];
    this.currentStep = 3;
    this.renderStep3();
  }

  /**
   * Handle Step 3 final submission
   * @private
   */
  handleStep3Submit() {
    try {
      // Save income to BudgetStore
      const incomeSuccess = store.setupIncome(this.incomeData.amount, this.incomeData.days);

      if (!incomeSuccess) {
        alert('Failed to save income. Please try again.');
        return;
      }

      // Add each initial expense
      let expensesSuccess = true;
      for (const expense of this.initialExpenses) {
        const success = store.addInitialExpense(expense);
        if (!success) {
          console.error('Failed to add initial expense:', expense);
          expensesSuccess = false;
          break;
        }
      }

      if (!expensesSuccess) {
        alert('Some initial expenses could not be saved. Please check the console for details.');
        return;
      }

      // Success!
      console.log('Setup complete:', {
        income: formatMoney(this.incomeData.amount),
        days: this.incomeData.days,
        initialExpenses: this.initialExpenses.length
      });

      // Hide modal
      this.hideModal();

      // Emit success event
      this.emitEvent('income-setup-complete', {
        income: this.incomeData,
        initialExpenses: this.initialExpenses
      });

    } catch (error) {
      console.error('Error completing setup:', error);
      alert('An error occurred during setup. Please try again.');
    }
  }

  /**
   * Handle back button click
   * @private
   */
  handleBack() {
    if (this.currentStep === 2) {
      this.currentStep = 1;
      this.renderStep1(false, false);
    } else if (this.currentStep === 3) {
      this.currentStep = 2;
      this.renderStep2();
    }
  }

  /**
   * Handle cancel button click
   * @private
   */
  handleCancel(e) {
    if (e) e.preventDefault();

    // Check if income has been set up
    const state = store.getState();

    if (state.income.amount === 0) {
      const confirmed = confirm(
        'You need to set up your income to use the budget tracker. Are you sure you want to cancel?'
      );

      if (!confirmed) {
        return;
      }
    }

    this.hideModal();
  }

  /**
   * Handle adding an expense (Step 2)
   * @private
   */
  handleAddExpense() {
    // The InitialExpensesForm will handle this
    // We listen for the 'initial-expense-added' event in constructor
  }

  /**
   * Handle removing a temporary expense (Step 2)
   * @private
   */
  handleRemoveExpense(e) {
    const index = parseInt(e.target.dataset.index, 10);

    if (isNaN(index) || index < 0 || index >= this.initialExpenses.length) {
      return;
    }

    const expense = this.initialExpenses[index];
    const confirmed = confirm(`Remove "${expense.description}"?`);

    if (!confirmed) {
      return;
    }

    // Remove from array
    this.initialExpenses.splice(index, 1);

    // Re-render step 2
    this.renderStep2();
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
export default new IncomeSetup();
