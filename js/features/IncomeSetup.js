/**
 * Income Setup Feature
 * Daily Budget Tracker
 *
 * Handles one-time income setup for MVP.
 * Collects income amount and duration, initializes budget state.
 */

import store from '../state/BudgetStore.js';
import { getToday, addDays, formatDate, getDaysUntil } from '../utils/dateUtils.js';
import { parseMoney, validateAmount, formatMoney } from '../utils/moneyUtils.js';

/**
 * IncomeSetup class manages the income configuration modal
 */
export class IncomeSetup {
  /**
   * Initialize the IncomeSetup feature
   */
  constructor() {
    // Get DOM elements
    this.modal = document.getElementById('income-modal');
    this.form = document.getElementById('income-form');
    this.amountInput = document.getElementById('income-amount');
    this.daysInput = document.getElementById('income-days');
    this.closeButtons = this.modal.querySelectorAll('[data-action="close-modal"]');
    this.overlay = this.modal.querySelector('.modal-overlay');

    // Bind methods
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);

    // Initialize event listeners
    this.initEventListeners();

    // Check if first time user (no income set)
    this.checkFirstTimeUser();
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

    // Input changes for live validation
    this.amountInput.addEventListener('input', this.handleInputChange);
    this.daysInput.addEventListener('input', this.handleInputChange);

    // Listen for "Manage Income" button clicks
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="manage-income"]')) {
        this.showModal();
      }
    });
  }

  /**
   * Check if this is a first-time user and auto-open modal
   * @private
   */
  checkFirstTimeUser() {
    const state = store.getState();

    // If no income has been set up, show the modal
    if (state.income.amount === 0) {
      // Delay slightly to ensure DOM is ready
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
    // Update modal title for first-time users
    if (isFirstTime) {
      const title = this.modal.querySelector('.modal-title');
      title.textContent = "Let's Start by Setting Up Your Income";
    }

    // Load existing values if editing
    const state = store.getState();
    if (state.income.amount > 0) {
      this.amountInput.value = state.income.amount;
      this.daysInput.value = state.income.daysToLast;
    }

    // Show modal
    this.modal.removeAttribute('hidden');

    // Focus on first input
    setTimeout(() => {
      this.amountInput.focus();
    }, 100);

    // Emit event
    this.emitEvent('income-modal-opened');
  }

  /**
   * Hide the income setup modal
   */
  hideModal() {
    this.modal.setAttribute('hidden', '');

    // Reset form
    this.form.reset();

    // Reset title to default
    const title = this.modal.querySelector('.modal-title');
    title.textContent = 'Setup Income';

    // Emit event
    this.emitEvent('income-modal-closed');
  }

  /**
   * Handle form submission
   * @private
   * @param {Event} e - Form submit event
   */
  handleSubmit(e) {
    e.preventDefault();

    // Validate inputs
    const validation = this.validateInputs();

    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // Save income
    const success = this.saveIncome(validation.amount, validation.days);

    if (success) {
      this.hideModal();

      // Emit success event
      this.emitEvent('income-saved', {
        amount: validation.amount,
        days: validation.days
      });
    } else {
      alert('Failed to save income. Please try again.');
    }
  }

  /**
   * Handle cancel/close action
   * @private
   * @param {Event} e - Click event
   */
  handleCancel(e) {
    e.preventDefault();

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
   * Handle input changes for live validation feedback
   * @private
   */
  handleInputChange() {
    // Remove invalid styling when user starts typing
    this.amountInput.classList.remove('error');
    this.daysInput.classList.remove('error');
  }

  /**
   * Validate form inputs
   * @private
   * @returns {Object} Validation result with valid flag, error message, and parsed values
   */
  validateInputs() {
    const amountValue = this.amountInput.value.trim();
    const daysValue = this.daysInput.value.trim();

    // Check if inputs are empty
    if (!amountValue || !daysValue) {
      return {
        valid: false,
        error: 'Please fill in all fields.'
      };
    }

    // Parse amount
    const amount = parseMoney(amountValue);

    // Validate amount
    if (!validateAmount(amount) || amount <= 0) {
      this.amountInput.classList.add('error');
      return {
        valid: false,
        error: 'Please enter a valid income amount greater than $0.'
      };
    }

    // Parse days
    const days = parseInt(daysValue, 10);

    // Validate days
    if (isNaN(days) || days < 1) {
      this.daysInput.classList.add('error');
      return {
        valid: false,
        error: 'Please enter a valid number of days (at least 1).'
      };
    }

    if (days > 365) {
      this.daysInput.classList.add('error');
      return {
        valid: false,
        error: 'Days to last cannot exceed 365 days.'
      };
    }

    return {
      valid: true,
      amount,
      days
    };
  }

  /**
   * Calculate end date based on start date and days
   * @param {Date} startDate - The start date
   * @param {number} days - Number of days to last
   * @returns {Date} The calculated end date
   */
  calculateEndDate(startDate, days) {
    return addDays(startDate, days);
  }

  /**
   * Save income to BudgetStore and initialize budget
   * @private
   * @param {number} amount - Income amount
   * @param {number} days - Days to last
   * @returns {boolean} Success status
   */
  saveIncome(amount, days) {
    try {
      // Use BudgetStore's setupIncome method
      const success = store.setupIncome(amount, days);

      if (success) {
        console.log('Income saved successfully:', {
          amount: formatMoney(amount),
          days,
          dailyBudget: formatMoney(amount / days)
        });
      }

      return success;
    } catch (error) {
      console.error('Error saving income:', error);
      return false;
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
   * Get preview of budget based on current inputs
   * @returns {Object|null} Preview data or null if invalid
   */
  getPreview() {
    const validation = this.validateInputs();

    if (!validation.valid) {
      return null;
    }

    const startDate = getToday();
    const endDate = this.calculateEndDate(startDate, validation.days);
    const dailyBudget = validation.amount / validation.days;

    return {
      amount: validation.amount,
      days: validation.days,
      startDate,
      endDate,
      endDateFormatted: formatDate(endDate, 'long'),
      dailyBudget,
      dailyBudgetFormatted: formatMoney(dailyBudget)
    };
  }
}

// Export singleton instance
export default new IncomeSetup();
