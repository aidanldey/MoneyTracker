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
import { getToday, addDays, formatDate, getDaysUntil } from '../utils/dateUtils.js';
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
    const existingFrequency = isEditing ? state.income.frequency : 'one-time';
    const existingNextPayday = isEditing && state.income.nextPayday ? formatDate(state.income.nextPayday, 'iso') : '';

    const isRecurring = existingFrequency !== 'one-time';

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
            <label>Income Type</label>
            <div class="radio-group">
              <label class="radio-label">
                <input
                  type="radio"
                  name="income-type"
                  value="one-time"
                  ${!isRecurring ? 'checked' : ''}
                  required>
                <span>One-Time</span>
              </label>
              <label class="radio-label">
                <input
                  type="radio"
                  name="income-type"
                  value="recurring"
                  ${isRecurring ? 'checked' : ''}
                  required>
                <span>Recurring</span>
              </label>
            </div>
          </div>

          <div id="one-time-fields" class="conditional-fields" ${!isRecurring ? '' : 'style="display:none;"'}>
            <div class="form-group">
              <label for="income-days">Days to Last</label>
              <input
                type="number"
                id="income-days"
                name="days"
                placeholder="14"
                min="1"
                max="365"
                value="${existingDays}">
            </div>
          </div>

          <div id="recurring-fields" class="conditional-fields" ${isRecurring ? '' : 'style="display:none;"'}>
            <div class="form-group">
              <label for="income-frequency">Pay Frequency</label>
              <select id="income-frequency" name="frequency">
                <option value="weekly" ${existingFrequency === 'weekly' ? 'selected' : ''}>Weekly (every 7 days)</option>
                <option value="bi-weekly" ${existingFrequency === 'bi-weekly' ? 'selected' : ''}>Bi-Weekly (every 14 days)</option>
                <option value="semi-monthly" ${existingFrequency === 'semi-monthly' ? 'selected' : ''}>Semi-Monthly (twice a month)</option>
                <option value="monthly" ${existingFrequency === 'monthly' ? 'selected' : ''}>Monthly</option>
              </select>
            </div>

            <div class="form-group">
              <label for="next-payday">Next Payday</label>
              <input
                type="date"
                id="next-payday"
                name="nextPayday"
                value="${existingNextPayday}"
                min="${formatDate(getToday(), 'iso')}">
              <p class="help-text" id="payday-preview"></p>
            </div>
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
    const incomeTypeRadios = document.querySelectorAll('input[name="income-type"]');
    const frequencySelect = document.getElementById('income-frequency');
    const nextPaydayInput = document.getElementById('next-payday');

    form.addEventListener('submit', this.handleStep1Submit);
    cancelBtn.addEventListener('click', this.handleCancel);

    // Toggle fields based on income type
    incomeTypeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const oneTimeFields = document.getElementById('one-time-fields');
        const recurringFields = document.getElementById('recurring-fields');
        const daysInput = document.getElementById('income-days');
        const frequencyInput = document.getElementById('income-frequency');
        const nextPaydayInput = document.getElementById('next-payday');

        if (e.target.value === 'one-time') {
          oneTimeFields.style.display = 'block';
          recurringFields.style.display = 'none';
          daysInput.required = true;
          frequencyInput.required = false;
          nextPaydayInput.required = false;
        } else {
          oneTimeFields.style.display = 'none';
          recurringFields.style.display = 'block';
          daysInput.required = false;
          frequencyInput.required = true;
          nextPaydayInput.required = true;
          this.updatePaydayPreview();
        }
      });
    });

    // Update payday preview when frequency or next payday changes
    if (frequencySelect && nextPaydayInput) {
      frequencySelect.addEventListener('change', () => this.updatePaydayPreview());
      nextPaydayInput.addEventListener('change', () => this.updatePaydayPreview());
    }

    // Initial payday preview update if recurring
    if (isRecurring) {
      setTimeout(() => this.updatePaydayPreview(), 50);
    }

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
    const incomeType = document.querySelector('input[name="income-type"]:checked').value;

    const amount = parseMoney(amountInput.value);

    // Validate amount
    if (!validateAmount(amount) || amount <= 0) {
      alert('Please enter a valid income amount greater than $0.');
      amountInput.focus();
      return;
    }

    // Handle one-time or recurring based on selection
    if (incomeType === 'one-time') {
      const daysInput = document.getElementById('income-days');
      const days = parseInt(daysInput.value, 10);

      if (isNaN(days) || days < 1 || days > 365) {
        alert('Please enter a valid number of days (1-365).');
        daysInput.focus();
        return;
      }

      // Store one-time income data temporarily
      this.incomeData = {
        amount,
        days,
        startDate: getToday(),
        frequency: 'one-time',
        nextPayday: null
      };
    } else {
      // Recurring income
      const frequencyInput = document.getElementById('income-frequency');
      const nextPaydayInput = document.getElementById('next-payday');

      const frequency = frequencyInput.value;
      const nextPayday = nextPaydayInput.value;

      if (!nextPayday) {
        alert('Please select your next payday date.');
        nextPaydayInput.focus();
        return;
      }

      // Validate next payday is in the future
      const nextPaydayDate = new Date(nextPayday);
      const today = getToday();
      if (nextPaydayDate < today) {
        alert('Next payday must be today or in the future.');
        nextPaydayInput.focus();
        return;
      }

      // Calculate days until next payday
      const daysUntilPayday = getDaysUntil(nextPayday);
      const days = daysUntilPayday > 0 ? daysUntilPayday : 1;

      // Store recurring income data temporarily
      this.incomeData = {
        amount,
        days,
        startDate: getToday(),
        frequency,
        nextPayday: nextPaydayDate.toISOString()
      };
    }

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
      // Save income to BudgetStore (with frequency and nextPayday for recurring)
      const incomeSuccess = store.setupIncome(
        this.incomeData.amount,
        this.incomeData.days,
        this.incomeData.frequency,
        this.incomeData.nextPayday
      );

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
        frequency: this.incomeData.frequency,
        nextPayday: this.incomeData.nextPayday ? formatDate(this.incomeData.nextPayday, 'long') : 'N/A',
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
   * Update the payday preview text showing future paydays
   * @private
   */
  updatePaydayPreview() {
    const frequencyInput = document.getElementById('income-frequency');
    const nextPaydayInput = document.getElementById('next-payday');
    const previewText = document.getElementById('payday-preview');

    if (!frequencyInput || !nextPaydayInput || !previewText) {
      return;
    }

    const frequency = frequencyInput.value;
    const nextPayday = nextPaydayInput.value;

    if (!nextPayday) {
      previewText.textContent = '';
      return;
    }

    const nextPaydayDate = new Date(nextPayday);
    const futurePaydays = this.calculateFuturePaydays(nextPaydayDate, frequency, 3);

    if (futurePaydays.length === 0) {
      previewText.textContent = '';
      return;
    }

    const daysUntil = getDaysUntil(nextPayday);
    const daysText = daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`;

    const futureText = futurePaydays.slice(1).map(date => formatDate(date, 'short')).join(', ');
    previewText.textContent = `Next payday ${daysText}. Future paydays: ${futureText}`;
  }

  /**
   * Calculate future payday dates based on frequency
   * @private
   * @param {Date} startDate - The first payday date
   * @param {string} frequency - weekly, bi-weekly, semi-monthly, or monthly
   * @param {number} count - Number of future paydays to calculate
   * @returns {Array<Date>} Array of future payday dates
   */
  calculateFuturePaydays(startDate, frequency, count = 3) {
    const paydays = [new Date(startDate)];

    for (let i = 1; i < count; i++) {
      const lastPayday = paydays[paydays.length - 1];
      let nextPayday;

      switch (frequency) {
        case 'weekly':
          nextPayday = addDays(lastPayday, 7);
          break;

        case 'bi-weekly':
          nextPayday = addDays(lastPayday, 14);
          break;

        case 'semi-monthly':
          // Semi-monthly: 1st and 15th typically, or 15 days apart
          nextPayday = addDays(lastPayday, 15);
          break;

        case 'monthly':
          // Add one month, keeping same day of month
          nextPayday = new Date(lastPayday);
          nextPayday.setMonth(nextPayday.getMonth() + 1);
          // Handle edge case where day doesn't exist in next month (e.g., Jan 31 -> Feb 28)
          if (nextPayday.getDate() !== lastPayday.getDate()) {
            nextPayday.setDate(0); // Set to last day of previous month
          }
          break;

        default:
          nextPayday = addDays(lastPayday, 14);
      }

      paydays.push(nextPayday);
    }

    return paydays;
  }

  /**
   * Calculate the number of days until next payday based on frequency
   * @private
   * @param {string} frequency - weekly, bi-weekly, semi-monthly, or monthly
   * @returns {number} Number of days until next payday
   */
  getDaysForFrequency(frequency) {
    switch (frequency) {
      case 'weekly':
        return 7;
      case 'bi-weekly':
        return 14;
      case 'semi-monthly':
        return 15;
      case 'monthly':
        return 30;
      default:
        return 14;
    }
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
