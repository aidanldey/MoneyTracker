/**
 * Initial Expenses Form Feature
 * Daily Budget Tracker
 *
 * Handles adding initial expenses (known upcoming costs that should be
 * reserved from available balance).
 */

import store from '../state/BudgetStore.js';
import { parseMoney, validateAmount, formatMoney } from '../utils/moneyUtils.js';

/**
 * InitialExpensesForm class manages the add initial expense modal
 */
export class InitialExpensesForm {
  /**
   * Initialize the InitialExpensesForm feature
   */
  constructor() {
    // Get DOM elements (will be created in HTML)
    this.modal = document.getElementById('initial-expense-modal');

    // Wait for DOM to be ready before accessing elements
    if (!this.modal) {
      console.warn('InitialExpensesForm: Modal not found in DOM yet');
      return;
    }

    this.form = document.getElementById('initial-expense-form');
    this.descriptionInput = document.getElementById('ie-description');
    this.amountInput = document.getElementById('ie-amount');
    this.categorySelect = document.getElementById('ie-category');
    this.notesInput = document.getElementById('ie-notes');
    this.closeButtons = this.modal.querySelectorAll('[data-action="close-modal"]');
    this.overlay = this.modal.querySelector('.modal-overlay');
    this.submitButton = this.modal.querySelector('#submit-btn');
    this.cancelButton = this.modal.querySelector('#cancel-btn');
    this.errorMessage = this.modal.querySelector('.error-message');

    // Preview elements
    this.previewFund = this.modal.querySelector('.preview-fund');
    this.previewBudget = this.modal.querySelector('.preview-budget');

    // Bind methods
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleAmountInput = this.handleAmountInput.bind(this);

    // Initialize event listeners
    this.initEventListeners();
  }

  /**
   * Initialize event listeners
   * @private
   */
  initEventListeners() {
    if (!this.form) return;

    // Form submission
    this.form.addEventListener('submit', this.handleSubmit);

    // Cancel button
    if (this.cancelButton) {
      this.cancelButton.addEventListener('click', this.handleCancel);
    }

    // Close buttons
    if (this.closeButtons) {
      this.closeButtons.forEach(button => {
        button.addEventListener('click', this.handleCancel);
      });
    }

    // Overlay click to close
    if (this.overlay) {
      this.overlay.addEventListener('click', this.handleCancel);
    }

    // Amount input for live validation and preview
    if (this.amountInput) {
      this.amountInput.addEventListener('input', this.handleAmountInput);
    }

    // Listen for global button clicks to open modal
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="add-initial-expense"]')) {
        this.showModal();
      }
    });
  }

  /**
   * Show the add initial expense modal
   * @param {Object} existingExpense - Optional: expense to edit (not implemented in MVP)
   */
  showModal(existingExpense = null) {
    if (!this.modal) {
      console.error('showModal: Modal element not found');
      return;
    }

    // Check if income has been set up
    const state = store.getState();
    if (state.income.amount === 0) {
      alert('Please set up your income first before adding initial expenses.');
      return;
    }

    // Reset form
    this.form.reset();
    this.hideError();
    this.updatePreview(0);

    // Show modal
    this.modal.removeAttribute('hidden');

    // Focus on description input
    setTimeout(() => {
      if (this.descriptionInput) {
        this.descriptionInput.focus();
      }
    }, 100);

    // Emit event
    this.emitEvent('initial-expense-modal-opened');
  }

  /**
   * Hide the add initial expense modal
   */
  hideModal() {
    if (!this.modal) return;

    this.modal.setAttribute('hidden', '');
    this.form.reset();
    this.hideError();
    this.updatePreview(0);

    // Emit event
    this.emitEvent('initial-expense-modal-closed');
  }

  /**
   * Handle amount input for live validation and preview
   * @private
   */
  handleAmountInput() {
    const validation = this.validateAmount();

    // Clear previous errors
    this.hideError();

    if (!validation.valid && validation.amount > 0) {
      // Show error
      this.showError(validation.error);
      this.updatePreview(0);
      if (this.submitButton) {
        this.submitButton.disabled = true;
      }
    } else if (validation.valid) {
      // Show preview
      this.updatePreview(validation.amount);
      if (this.submitButton) {
        this.submitButton.disabled = false;
      }
    } else {
      // Empty or zero input
      this.updatePreview(0);
      if (this.submitButton) {
        this.submitButton.disabled = false;
      }
    }
  }

  /**
   * Validate amount
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
   * Validate all inputs
   * @private
   * @returns {Object} Validation result
   */
  validateInputs() {
    const descriptionValue = this.descriptionInput.value.trim();
    const amountValidation = this.validateAmount();

    // Check description
    if (!descriptionValue || descriptionValue.length < 2) {
      return {
        valid: false,
        error: 'Description is required (minimum 2 characters).'
      };
    }

    // Check amount
    if (!amountValidation.valid) {
      return amountValidation;
    }

    if (amountValidation.amount <= 0) {
      return {
        valid: false,
        error: 'Amount must be greater than $0.'
      };
    }

    return {
      valid: true,
      amount: amountValidation.amount,
      description: descriptionValue
    };
  }

  /**
   * Update preview display
   * @private
   * @param {number} amount - Initial expense amount
   */
  updatePreview(amount) {
    const state = store.getState();

    // Calculate new fund total
    const newFund = state.initialExpenses.fund + amount;

    // Calculate new daily budget
    const newBalance = state.budget.currentBalance - amount;
    const availableBalance = newBalance - newFund;
    const newDailyBudget = state.budget.daysRemaining > 0
      ? availableBalance / state.budget.daysRemaining
      : 0;

    // Update preview elements
    if (this.previewFund) {
      this.previewFund.textContent = formatMoney(newFund);
    }

    if (this.previewBudget) {
      this.previewBudget.textContent = formatMoney(Math.max(0, newDailyBudget));

      // Color code based on budget change
      if (newDailyBudget < state.budget.dailyBudget * 0.5) {
        this.previewBudget.style.color = 'var(--color-status-danger)';
      } else if (newDailyBudget < state.budget.dailyBudget * 0.75) {
        this.previewBudget.style.color = 'var(--color-status-warning)';
      } else {
        this.previewBudget.style.color = 'var(--color-text)';
      }
    }
  }

  /**
   * Show error message
   * @private
   * @param {string} message - Error message
   */
  showError(message) {
    if (!this.errorMessage) return;

    this.errorMessage.textContent = message;
    this.errorMessage.style.display = 'block';
  }

  /**
   * Hide error message
   * @private
   */
  hideError() {
    if (!this.errorMessage) return;

    this.errorMessage.textContent = '';
    this.errorMessage.style.display = 'none';
  }

  /**
   * Handle form submission
   * @private
   * @param {Event} e - Form submit event
   */
  handleSubmit(e) {
    e.preventDefault();

    // Final validation
    const validation = this.validateInputs();

    if (!validation.valid) {
      this.showError(validation.error || 'Please fix the errors and try again.');
      return;
    }

    // Get form values
    const expense = {
      description: validation.description,
      amount: validation.amount,
      category: this.categorySelect.value || null,
      notes: this.notesInput.value.trim() || ''
    };

    // Add expense
    const success = this.addExpense(expense);

    if (success) {
      this.hideModal();

      // Show success message
      this.showSuccessMessage(`Initial expense "${expense.description}" added successfully!`);

      // Emit success event
      this.emitEvent('initial-expense-added', expense);
    } else {
      this.showError('Failed to add initial expense. Please try again.');
    }
  }

  /**
   * Add initial expense to BudgetStore
   * @param {Object} expense - Expense object
   * @returns {boolean} Success status
   */
  addExpense(expense) {
    try {
      // Use BudgetStore's addInitialExpense method
      const success = store.addInitialExpense(expense);

      if (success) {
        console.log('Initial expense added successfully:', {
          description: expense.description,
          amount: formatMoney(expense.amount),
          category: expense.category
        });
      }

      return success;
    } catch (error) {
      console.error('Error adding initial expense:', error);
      return false;
    }
  }

  /**
   * Show success message (temporary)
   * @private
   * @param {string} message - Success message
   */
  showSuccessMessage(message) {
    // Create temporary success message element
    const successEl = document.createElement('div');
    successEl.className = 'success-toast';
    successEl.textContent = message;
    successEl.style.cssText = `
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

    document.body.appendChild(successEl);

    // Remove after 3 seconds
    setTimeout(() => {
      successEl.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(successEl);
      }, 300);
    }, 3000);
  }

  /**
   * Handle cancel/close action
   * @private
   * @param {Event} e - Click event
   */
  handleCancel(e) {
    if (e) {
      e.preventDefault();
    }
    this.hideModal();
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
    return {
      description: this.descriptionInput ? this.descriptionInput.value.trim() : '',
      amount: parseMoney(this.amountInput ? this.amountInput.value : '0'),
      category: this.categorySelect ? this.categorySelect.value : null,
      notes: this.notesInput ? this.notesInput.value.trim() : ''
    };
  }
}

// Export singleton instance (will be initialized when DOM is ready)
export default new InitialExpensesForm();
