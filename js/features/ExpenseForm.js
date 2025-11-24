/**
 * Expense Form Feature
 * Daily Budget Tracker
 *
 * Handles one-time expense entry for MVP.
 * Collects expense details, validates, and updates budget state.
 */

import store from '../state/BudgetStore.js';
import { getToday, isToday, formatDate } from '../utils/dateUtils.js';
import { parseMoney, validateAmount, formatMoney } from '../utils/moneyUtils.js';
import RecurringExpense from '../models/RecurringExpense.js';
import initialExpensesForm from './InitialExpensesForm.js';

/**
 * ExpenseForm class manages the add expense modal
 */
export class ExpenseForm {
  /**
   * Initialize the ExpenseForm feature
   */
  constructor() {
    // Get DOM elements
    this.modal = document.getElementById('expense-modal');
    this.form = document.getElementById('expense-form');
    this.amountInput = document.getElementById('expense-amount');
    this.descriptionInput = document.getElementById('expense-description');
    this.categorySelect = document.getElementById('expense-category');
    this.customNameInput = document.getElementById('expense-custom-name');
    this.customNameGroup = document.getElementById('expense-custom-name-group');
    this.closeButtons = this.modal.querySelectorAll('[data-action="close-modal"]');
    this.overlay = this.modal.querySelector('.modal-overlay');
    this.submitButton = this.form.querySelector('button[type="submit"]');

    // Recurring expense elements
    this.isRecurringCheckbox = document.getElementById('expense-is-recurring');
    this.recurringFields = document.getElementById('recurring-expense-fields');
    this.frequencySelect = document.getElementById('expense-frequency');
    this.startDateInput = document.getElementById('expense-start-date');
    this.endDateInput = document.getElementById('expense-end-date');
    this.recurringPreviewDiv = this.modal.querySelector('.recurring-preview');
    this.recurringPreviewText = document.getElementById('recurring-preview-text');

    // Create preview element (will be added to modal)
    this.createPreviewElement();

    // Bind methods
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleAmountInput = this.handleAmountInput.bind(this);
    this.handleCategoryChange = this.handleCategoryChange.bind(this);
    this.handleRecurringToggle = this.handleRecurringToggle.bind(this);
    this.handleRecurringFieldChange = this.handleRecurringFieldChange.bind(this);

    // Initialize event listeners
    this.initEventListeners();
  }

  /**
   * Create and insert preview element into modal
   * @private
   */
  createPreviewElement() {
    // Create preview container
    this.previewElement = document.createElement('div');
    this.previewElement.className = 'expense-preview';
    this.previewElement.style.cssText = `
      padding: var(--spacing-md);
      background-color: var(--color-surface);
      border-radius: var(--radius-md);
      margin-top: var(--spacing-md);
      display: none;
    `;

    this.previewElement.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: var(--spacing-sm);">
        <span style="font-size: var(--font-size-small); opacity: 0.7;">Remaining balance after:</span>
        <span class="preview-balance money-value" style="font-weight: var(--font-weight-semibold);"></span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="font-size: var(--font-size-small); opacity: 0.7;">New daily budget:</span>
        <span class="preview-daily money-value" style="font-weight: var(--font-weight-semibold);"></span>
      </div>
    `;

    // Insert before modal actions
    const modalActions = this.form.querySelector('.modal-actions');
    this.form.insertBefore(this.previewElement, modalActions);

    // Get preview value elements
    this.previewBalance = this.previewElement.querySelector('.preview-balance');
    this.previewDaily = this.previewElement.querySelector('.preview-daily');
  }

  /**
   * Initialize event listeners
   * @private
   */
  initEventListeners() {
    // Form submission
    this.form.addEventListener('submit', this.handleSubmit);

    // Close button clicks
    this.closeButtons.forEach(button => {
      button.addEventListener('click', this.handleCancel);
    });

    // Overlay click to close
    this.overlay.addEventListener('click', this.handleCancel);

    // Amount input for live validation and preview
    this.amountInput.addEventListener('input', this.handleAmountInput);

    // Category select for showing/hiding custom name input
    this.categorySelect.addEventListener('change', this.handleCategoryChange);

    // Recurring expense checkbox
    if (this.isRecurringCheckbox) {
      this.isRecurringCheckbox.addEventListener('change', this.handleRecurringToggle);
    }

    // Recurring expense field changes
    if (this.frequencySelect) {
      this.frequencySelect.addEventListener('change', this.handleRecurringFieldChange);
    }
    if (this.startDateInput) {
      this.startDateInput.addEventListener('change', this.handleRecurringFieldChange);
    }
    if (this.endDateInput) {
      this.endDateInput.addEventListener('change', this.handleRecurringFieldChange);
    }

    // Listen for "Add Expense" button clicks
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="add-expense"]')) {
        this.showModal();
      }
    });
  }

  /**
   * Show the add expense modal
   */
  showModal() {
    // Check if income has been set up
    const state = store.getState();
    if (state.income.amount === 0) {
      alert('Please set up your income first before adding expenses.');
      return;
    }

    // Reset form
    this.form.reset();
    this.hidePreview();
    this.clearErrors();

    // Reset custom name field
    if (this.customNameGroup) {
      this.customNameGroup.style.display = 'none';
      this.customNameInput.value = '';
    }

    // Reset recurring fields
    if (this.recurringFields) {
      this.recurringFields.style.display = 'none';
    }
    if (this.recurringPreviewDiv) {
      this.recurringPreviewDiv.style.display = 'none';
    }

    // Show modal
    this.modal.removeAttribute('hidden');

    // Focus on amount input
    setTimeout(() => {
      this.amountInput.focus();
    }, 100);

    // Emit event
    this.emitEvent('expense-modal-opened');
  }

  /**
   * Hide the add expense modal
   */
  hideModal() {
    this.modal.setAttribute('hidden', '');
    this.form.reset();
    this.hidePreview();
    this.clearErrors();

    // Emit event
    this.emitEvent('expense-modal-closed');
  }

  /**
   * Handle amount input for live validation and preview
   * @private
   */
  handleAmountInput() {
    const validation = this.validateAmount();

    // Clear previous errors
    this.clearErrors();

    if (!validation.valid && validation.amount > 0) {
      // Show error
      this.showError(validation.error);
      this.hidePreview();
      this.submitButton.disabled = true;
    } else if (validation.valid) {
      // Show preview
      this.updatePreview(validation.amount);
      this.submitButton.disabled = false;
    } else {
      // Empty or zero input
      this.hidePreview();
      this.submitButton.disabled = false;
    }
  }

  /**
   * Handle category select change
   * @private
   */
  handleCategoryChange() {
    const categoryValue = this.categorySelect.value;

    // Show custom name input if a category is selected
    if (categoryValue) {
      this.customNameGroup.style.display = 'block';
    } else {
      this.customNameGroup.style.display = 'none';
      this.customNameInput.value = ''; // Clear custom name when category is deselected
    }
  }

  /**
   * Validate expense amount
   * @private
   * @returns {Object} Validation result
   */
  validateAmount() {
    const amountValue = this.amountInput.value.trim();

    // Empty is valid (will be caught by form validation)
    if (!amountValue) {
      return { valid: true, amount: 0 };
    }

    // Parse amount
    const amount = parseMoney(amountValue);

    // Check if valid number
    if (!validateAmount(amount)) {
      return {
        valid: false,
        amount: 0,
        error: 'Please enter a valid amount.'
      };
    }

    // Check if greater than 0
    if (amount <= 0) {
      return {
        valid: false,
        amount: 0,
        error: 'Amount must be greater than $0.'
      };
    }

    // Check against current balance
    const state = store.getState();
    const currentBalance = state.budget.currentBalance;

    if (amount > currentBalance) {
      return {
        valid: false,
        amount,
        error: `Insufficient funds. You have ${formatMoney(currentBalance)} available.`
      };
    }

    return {
      valid: true,
      amount
    };
  }

  /**
   * Calculate new balance after expense
   * @param {number} expenseAmount - The expense amount
   * @returns {Object} Calculation results
   */
  calculateNewBalance(expenseAmount) {
    const state = store.getState();
    const currentBalance = state.budget.currentBalance;
    const daysRemaining = state.budget.daysRemaining;

    const newBalance = currentBalance - expenseAmount;
    const newDailyBudget = daysRemaining > 0 ? newBalance / daysRemaining : 0;

    return {
      newBalance,
      newDailyBudget
    };
  }

  /**
   * Update preview display
   * @private
   * @param {number} amount - Expense amount
   */
  updatePreview(amount) {
    const calculation = this.calculateNewBalance(amount);

    this.previewBalance.textContent = formatMoney(calculation.newBalance);
    this.previewDaily.textContent = formatMoney(calculation.newDailyBudget);

    // Color code based on new balance
    if (calculation.newBalance < 0) {
      this.previewBalance.style.color = 'var(--color-status-danger)';
    } else if (calculation.newBalance < 50) {
      this.previewBalance.style.color = 'var(--color-status-warning)';
    } else {
      this.previewBalance.style.color = 'var(--color-text)';
    }

    this.previewElement.style.display = 'block';
  }

  /**
   * Hide preview display
   * @private
   */
  hidePreview() {
    this.previewElement.style.display = 'none';
  }

  /**
   * Show error message
   * @private
   * @param {string} message - Error message
   */
  showError(message) {
    // Remove existing error
    this.clearErrors();

    // Create error element
    const errorElement = document.createElement('div');
    errorElement.className = 'form-error';
    errorElement.style.cssText = `
      color: var(--color-status-danger);
      font-size: var(--font-size-small);
      margin-top: var(--spacing-xs);
    `;
    errorElement.textContent = message;

    // Insert after amount input
    const formGroup = this.amountInput.closest('.form-group');
    formGroup.appendChild(errorElement);

    // Add error styling to input
    this.amountInput.style.borderColor = 'var(--color-status-danger)';
  }

  /**
   * Clear error messages
   * @private
   */
  clearErrors() {
    // Remove error elements
    const errors = this.form.querySelectorAll('.form-error');
    errors.forEach(error => error.remove());

    // Reset input border
    this.amountInput.style.borderColor = '';
  }

  /**
   * Check if description matches bill keywords
   * @private
   * @param {string} description - Expense description
   * @returns {boolean} True if matches keywords
   */
  matchesBillKeywords(description) {
    const keywords = [
      'rent', 'mortgage',
      'insurance', 'premium',
      'bill', 'payment',
      'subscription', 'subscribe',
      'loan', 'credit',
      'utilities', 'utility',
      'internet', 'cable', 'phone'
    ];

    const lowerDesc = description.toLowerCase();
    return keywords.some(keyword => lowerDesc.includes(keyword));
  }

  /**
   * Handle form submission
   * @private
   * @param {Event} e - Form submit event
   */
  handleSubmit(e) {
    e.preventDefault();

    // Final validation
    const validation = this.validateAmount();

    if (!validation.valid) {
      this.showError(validation.error || 'Please enter a valid amount.');
      return;
    }

    if (validation.amount <= 0) {
      this.showError('Amount must be greater than $0.');
      return;
    }

    // Get form values
    const amount = validation.amount;
    const description = this.descriptionInput.value.trim() || 'Expense';
    const categoryType = this.categorySelect.value;
    const customName = this.customNameInput.value.trim();
    const isRecurring = this.isRecurringCheckbox.checked;

    // Handle recurring expense
    if (isRecurring) {
      const frequency = this.frequencySelect.value;
      const startDate = this.startDateInput.value;
      const endDate = this.endDateInput.value || null;

      // Validate recurring expense fields
      if (!startDate) {
        this.showError('Please select a start date for the recurring expense.');
        return;
      }

      // Create recurring expense object
      const recurringExpense = {
        amount,
        description,
        frequency,
        startDate,
        endDate,
        isRecurring: true
      };

      // Add category if selected
      if (categoryType) {
        recurringExpense.category = {
          type: categoryType,
          customName: customName || null
        };
      }

      // Validate with RecurringExpense model
      const validationResult = RecurringExpense.validate(recurringExpense);
      if (!validationResult.valid) {
        this.showError(validationResult.error);
        return;
      }

      // Add recurring expense
      const success = this.addRecurringExpense(recurringExpense);

      if (success) {
        this.hideModal();

        // Emit success event
        this.emitEvent('recurring-expense-added', recurringExpense);
      } else {
        this.showError('Failed to add recurring expense. Please try again.');
      }
      return;
    }

    // Check if this looks like a recurring bill (for one-time expenses)
    const state = store.getState();
    const hasIncome = state.income.amount > 0;

    if (hasIncome && this.matchesBillKeywords(description)) {
      const suggestion = confirm(
        `This looks like it might be a bill or recurring expense.\n\n` +
        `Would you like to add it as a Recurring Expense instead?\n\n` +
        `Recurring expenses are automatically deducted at the start of each pay cycle.\n\n` +
        `Click OK to make it recurring, or Cancel to add as one-time expense.`
      );

      if (suggestion) {
        // Check the recurring checkbox and return (let user configure)
        this.isRecurringCheckbox.checked = true;
        this.handleRecurringToggle();
        return;
      }
    }

    // Create one-time expense object
    const expense = {
      amount,
      description,
      date: getToday().toISOString()
    };

    // Add category if selected
    if (categoryType) {
      expense.category = {
        type: categoryType,
        customName: customName || null
      };
    }

    // Add expense
    const success = this.addExpense(expense);

    if (success) {
      this.hideModal();

      // Emit success event
      this.emitEvent('expense-added', expense);
    } else {
      this.showError('Failed to add expense. Please try again.');
    }
  }

  /**
   * Add expense to BudgetStore
   * @param {Object} expense - Expense object
   * @returns {boolean} Success status
   */
  addExpense(expense) {
    try {
      // Use BudgetStore's addExpense method
      const success = store.addExpense(expense);

      if (success) {
        console.log('Expense added successfully:', {
          amount: formatMoney(expense.amount),
          description: expense.description,
          category: expense.category || 'None'
        });
      }

      return success;
    } catch (error) {
      console.error('Error adding expense:', error);
      return false;
    }
  }

  /**
   * Add recurring expense to BudgetStore
   * @param {Object} recurringExpense - Recurring expense object
   * @returns {boolean} Success status
   */
  addRecurringExpense(recurringExpense) {
    try {
      // Use BudgetStore's addRecurringExpense method
      const success = store.addRecurringExpense(recurringExpense);

      if (success) {
        console.log('Recurring expense added successfully:', {
          amount: formatMoney(recurringExpense.amount),
          description: recurringExpense.description,
          frequency: recurringExpense.frequency,
          startDate: recurringExpense.startDate
        });
      }

      return success;
    } catch (error) {
      console.error('Error adding recurring expense:', error);
      return false;
    }
  }

  /**
   * Handle cancel/close action
   * @private
   * @param {Event} e - Click event
   */
  handleCancel(e) {
    e.preventDefault();
    this.hideModal();
  }

  /**
   * Handle recurring expense checkbox toggle
   * @private
   */
  handleRecurringToggle() {
    if (this.isRecurringCheckbox.checked) {
      this.recurringFields.style.display = 'block';
      // Set default start date to today
      this.startDateInput.value = formatDate(getToday(), 'iso');
      this.startDateInput.required = true;
      this.frequencySelect.required = true;
      this.updateRecurringPreview();
    } else {
      this.recurringFields.style.display = 'none';
      this.startDateInput.required = false;
      this.frequencySelect.required = false;
      this.recurringPreviewDiv.style.display = 'none';
    }
  }

  /**
   * Handle recurring field changes
   * @private
   */
  handleRecurringFieldChange() {
    if (this.isRecurringCheckbox.checked) {
      this.updateRecurringPreview();
    }
  }

  /**
   * Update recurring expense preview
   * @private
   */
  updateRecurringPreview() {
    const amount = parseMoney(this.amountInput.value);
    const frequency = this.frequencySelect.value;
    const startDate = this.startDateInput.value;

    if (!amount || amount <= 0 || !startDate) {
      this.recurringPreviewDiv.style.display = 'none';
      return;
    }

    const state = store.getState();
    const cycleEnd = state.budget.cycleEndDate;

    if (!cycleEnd) {
      this.recurringPreviewDiv.style.display = 'none';
      return;
    }

    // Calculate occurrences in current cycle
    const occurrences = RecurringExpense.calculateOccurrences(
      frequency,
      startDate,
      getToday(),
      cycleEnd,
      this.endDateInput.value || null
    );

    const totalDeduction = amount * occurrences;
    const frequencyLabel = RecurringExpense.getFrequencyLabel(frequency);

    if (occurrences > 0) {
      this.recurringPreviewText.textContent =
        `${frequencyLabel} • ${occurrences} occurrence${occurrences > 1 ? 's' : ''} this cycle = ${formatMoney(totalDeduction)} total`;
      this.recurringPreviewDiv.style.display = 'block';
    } else {
      this.recurringPreviewText.textContent =
        `${frequencyLabel} • No occurrences in current cycle`;
      this.recurringPreviewDiv.style.display = 'block';
    }
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

  /**
   * Get current form values
   * @returns {Object} Current form values
   */
  getFormValues() {
    const values = {
      amount: parseMoney(this.amountInput.value),
      description: this.descriptionInput.value.trim()
    };

    const categoryType = this.categorySelect.value;
    const customName = this.customNameInput.value.trim();

    if (categoryType) {
      values.category = {
        type: categoryType,
        customName: customName || null
      };
    }

    return values;
  }
}

// Export singleton instance
export default new ExpenseForm();
