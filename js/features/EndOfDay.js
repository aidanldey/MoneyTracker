/**
 * End of Day Feature
 * Daily Budget Tracker
 *
 * Handles end-of-day reconciliation for leftover or overspent funds.
 * Provides options to manage budget adjustments and savings.
 */

import { formatMoney, parseMoney } from '../utils/formatters.js';
import { getToday } from '../utils/dateUtils.js';

export class EndOfDay {
  constructor(store) {
    this.store = store;
    this.modal = document.getElementById('end-of-day-modal');
    this.overlay = document.getElementById('end-of-day-overlay');

    // Scenario containers
    this.leftoverContainer = document.getElementById('eod-leftover-container');
    this.overspentContainer = document.getElementById('eod-overspent-container');

    // Leftover elements
    this.leftoverAmount = document.getElementById('eod-leftover-amount');
    this.leftoverDailyBudget = document.getElementById('eod-leftover-daily-budget');
    this.addToSavingsBtn = document.getElementById('eod-add-to-savings');
    this.redistributeBtn = document.getElementById('eod-redistribute');
    this.leaveInBalanceBtn = document.getElementById('eod-leave-in-balance');
    this.savingsPreview = document.getElementById('eod-savings-preview');
    this.redistributePreview = document.getElementById('eod-redistribute-preview');

    // Overspent elements
    this.overspentAmount = document.getElementById('eod-overspent-amount');
    this.overspentDailyBudget = document.getElementById('eod-overspent-daily-budget');
    this.useSavingsBtn = document.getElementById('eod-use-savings');
    this.adjustBudgetBtn = document.getElementById('eod-adjust-budget');
    this.useSavingsPreview = document.getElementById('eod-use-savings-preview');
    this.adjustBudgetPreview = document.getElementById('eod-adjust-budget-preview');
    this.savingsWarning = document.getElementById('eod-savings-warning');

    // Close button
    this.closeBtn = document.getElementById('eod-close-btn');

    // State
    this.currentScenario = null;
    this.difference = 0;

    this.init();
  }

  init() {
    // Bind event listeners
    this.closeBtn?.addEventListener('click', () => this.close());
    this.overlay?.addEventListener('click', () => this.close());

    // Leftover options
    this.addToSavingsBtn?.addEventListener('click', () => this.handleAddToSavings());
    this.redistributeBtn?.addEventListener('click', () => this.handleRedistribute());
    this.leaveInBalanceBtn?.addEventListener('click', () => this.handleLeaveInBalance());

    // Overspent options
    this.useSavingsBtn?.addEventListener('click', () => this.handleUseSavings());
    this.adjustBudgetBtn?.addEventListener('click', () => this.handleAdjustBudget());

    console.log('EndOfDay: Feature initialized');
  }

  /**
   * Open the end-of-day modal
   */
  open() {
    const state = this.store.getState();
    const todaySpent = state.budget.todaySpent || 0;
    const dailyBudget = state.budget.dailyBudget || 0;

    // Calculate difference
    this.difference = dailyBudget - todaySpent;

    // Determine scenario
    if (this.difference > 0) {
      this.currentScenario = 'LEFTOVER';
      this.showLeftoverScenario();
    } else if (this.difference < 0) {
      this.currentScenario = 'OVERSPENT';
      this.showOverspentScenario();
    } else {
      // Exactly on budget
      this.currentScenario = 'EXACT';
      this.showExactScenario();
    }

    // Show modal
    this.modal.removeAttribute('hidden');

    console.log('EndOfDay: Modal opened', {
      scenario: this.currentScenario,
      todaySpent: formatMoney(todaySpent),
      dailyBudget: formatMoney(dailyBudget),
      difference: formatMoney(this.difference)
    });
  }

  /**
   * Close the modal
   */
  close() {
    this.modal.setAttribute('hidden', '');
    this.currentScenario = null;
    this.difference = 0;
  }

  /**
   * Show leftover funds scenario
   */
  showLeftoverScenario() {
    const state = this.store.getState();
    const dailyBudget = state.budget.dailyBudget || 0;
    const daysRemaining = state.budget.daysRemaining || 1;
    const currentSavings = state.budget.savingsFund || 0;

    // Hide overspent, show leftover
    this.overspentContainer.style.display = 'none';
    this.leftoverContainer.style.display = 'block';

    // Update amounts
    this.leftoverAmount.textContent = formatMoney(this.difference);
    this.leftoverDailyBudget.textContent = formatMoney(dailyBudget);

    // Calculate previews
    const newSavings = currentSavings + this.difference;
    const redistributedBalance = state.budget.currentBalance;
    const newDailyBudget = this.store.calculator.calculateDailyBudget(
      redistributedBalance,
      daysRemaining
    );

    // Update previews
    this.savingsPreview.textContent = `New savings: ${formatMoney(newSavings)}`;
    this.redistributePreview.textContent = `New daily budget: ${formatMoney(newDailyBudget)}`;
  }

  /**
   * Show overspent scenario
   */
  showOverspentScenario() {
    const state = this.store.getState();
    const dailyBudget = state.budget.dailyBudget || 0;
    const daysRemaining = state.budget.daysRemaining || 1;
    const currentSavings = state.budget.savingsFund || 0;
    const overspentAmount = Math.abs(this.difference);

    // Hide leftover, show overspent
    this.leftoverContainer.style.display = 'none';
    this.overspentContainer.style.display = 'block';

    // Update amounts
    this.overspentAmount.textContent = formatMoney(overspentAmount);
    this.overspentDailyBudget.textContent = formatMoney(dailyBudget);

    // Check if enough savings
    if (currentSavings >= overspentAmount) {
      const newSavings = currentSavings - overspentAmount;
      this.useSavingsPreview.textContent = `New savings: ${formatMoney(newSavings)}`;
      this.useSavingsBtn.disabled = false;
      this.savingsWarning.style.display = 'none';
    } else {
      this.useSavingsPreview.textContent = `Insufficient savings (${formatMoney(currentSavings)} available)`;
      this.useSavingsBtn.disabled = true;
      this.savingsWarning.style.display = 'block';
      this.savingsWarning.textContent = `You only have ${formatMoney(currentSavings)} in savings, but need ${formatMoney(overspentAmount)}.`;
    }

    // Calculate adjusted budget
    const newBalance = state.budget.currentBalance - overspentAmount;
    const newDailyBudget = this.store.calculator.calculateDailyBudget(
      newBalance - state.initialExpenses.fund - state.budget.recurringExpenseDeduction,
      daysRemaining
    );

    this.adjustBudgetPreview.textContent = `New daily budget: ${formatMoney(newDailyBudget)}`;
  }

  /**
   * Show exact budget scenario (spent exactly the daily budget)
   */
  showExactScenario() {
    // Hide both containers, show a simple message
    this.leftoverContainer.style.display = 'none';
    this.overspentContainer.style.display = 'none';

    // Create a simple message (we'll need to add this to HTML)
    const modalContent = this.modal.querySelector('.modal-content');
    const existingExact = document.getElementById('eod-exact-container');

    if (!existingExact) {
      const exactContainer = document.createElement('div');
      exactContainer.id = 'eod-exact-container';
      exactContainer.style.textAlign = 'center';
      exactContainer.style.padding = '2rem';
      exactContainer.innerHTML = `
        <h2 style="color: var(--color-success); margin-bottom: 1rem;">Perfect! 🎯</h2>
        <p style="font-size: 1.1rem; color: var(--color-text-secondary);">
          You spent exactly your daily budget today.
        </p>
        <button id="eod-exact-close" class="button button-primary" style="margin-top: 1.5rem;">
          Close
        </button>
      `;
      modalContent.insertBefore(exactContainer, modalContent.firstChild);

      // Add close handler
      document.getElementById('eod-exact-close')?.addEventListener('click', () => {
        this.reconcileDay('exact');
        this.close();
      });
    } else {
      existingExact.style.display = 'block';
    }
  }

  /**
   * Handle: Add leftover to savings
   */
  handleAddToSavings() {
    const state = this.store.getState();
    const currentSavings = state.budget.savingsFund || 0;
    const newSavings = currentSavings + this.difference;

    // Update savings in store
    this.store.setState({
      budget: {
        ...state.budget,
        savingsFund: newSavings
      }
    });

    console.log('EndOfDay: Added to savings', {
      amount: formatMoney(this.difference),
      newSavings: formatMoney(newSavings)
    });

    // Reconcile and close
    this.reconcileDay('add-to-savings');
    this.close();

    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('budget-updated'));
  }

  /**
   * Handle: Redistribute leftover across remaining days
   */
  handleRedistribute() {
    const state = this.store.getState();
    const daysRemaining = state.budget.daysRemaining || 1;

    // The leftover amount stays in currentBalance, so we just need to recalculate daily budget
    const availableBalance = state.budget.currentBalance - state.initialExpenses.fund - state.budget.recurringExpenseDeduction;
    const newDailyBudget = this.store.calculator.calculateDailyBudget(
      availableBalance,
      daysRemaining
    );

    // Update daily budget
    this.store.setState({
      budget: {
        ...state.budget,
        dailyBudget: newDailyBudget
      }
    });

    console.log('EndOfDay: Redistributed leftover', {
      amount: formatMoney(this.difference),
      newDailyBudget: formatMoney(newDailyBudget)
    });

    // Reconcile and close
    this.reconcileDay('redistribute');
    this.close();

    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('budget-updated'));
  }

  /**
   * Handle: Leave leftover in balance (do nothing)
   */
  handleLeaveInBalance() {
    console.log('EndOfDay: Left in balance', {
      amount: formatMoney(this.difference)
    });

    // Just reconcile and close (no state changes needed)
    this.reconcileDay('leave-in-balance');
    this.close();
  }

  /**
   * Handle: Use savings to cover overspending
   */
  handleUseSavings() {
    const state = this.store.getState();
    const currentSavings = state.budget.savingsFund || 0;
    const overspentAmount = Math.abs(this.difference);

    // Verify we have enough savings
    if (currentSavings < overspentAmount) {
      console.error('EndOfDay: Insufficient savings');
      return;
    }

    // Deduct from savings
    const newSavings = currentSavings - overspentAmount;

    // Add back to current balance
    const newBalance = state.budget.currentBalance + overspentAmount;

    // Update state
    this.store.setState({
      budget: {
        ...state.budget,
        savingsFund: newSavings,
        currentBalance: newBalance
      }
    });

    console.log('EndOfDay: Used savings', {
      amount: formatMoney(overspentAmount),
      newSavings: formatMoney(newSavings),
      newBalance: formatMoney(newBalance)
    });

    // Reconcile and close
    this.reconcileDay('use-savings');
    this.close();

    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('budget-updated'));
  }

  /**
   * Handle: Adjust budget to account for overspending
   */
  handleAdjustBudget() {
    const state = this.store.getState();
    const overspentAmount = Math.abs(this.difference);
    const daysRemaining = state.budget.daysRemaining || 1;

    // Reduce current balance by overspent amount
    const newBalance = state.budget.currentBalance - overspentAmount;

    // Recalculate daily budget with reduced balance
    const availableBalance = newBalance - state.initialExpenses.fund - state.budget.recurringExpenseDeduction;
    const newDailyBudget = this.store.calculator.calculateDailyBudget(
      availableBalance,
      daysRemaining
    );

    // Update state
    this.store.setState({
      budget: {
        ...state.budget,
        currentBalance: newBalance,
        dailyBudget: newDailyBudget
      }
    });

    console.log('EndOfDay: Adjusted budget', {
      overspent: formatMoney(overspentAmount),
      newBalance: formatMoney(newBalance),
      newDailyBudget: formatMoney(newDailyBudget)
    });

    // Reconcile and close
    this.reconcileDay('adjust-budget');
    this.close();

    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('budget-updated'));
  }

  /**
   * Mark the day as reconciled
   * @param {string} action - The action taken (add-to-savings, redistribute, etc.)
   */
  reconcileDay(action) {
    const state = this.store.getState();

    // Reset today's spent to 0 for new day
    this.store.setState({
      budget: {
        ...state.budget,
        todaySpent: 0
      }
    });

    // Could add to history here in future
    console.log('EndOfDay: Day reconciled', { action });

    // Dispatch reconciliation event
    window.dispatchEvent(new CustomEvent('day-reconciled', {
      detail: {
        action,
        difference: this.difference,
        date: getToday()
      }
    }));
  }
}

// Export singleton instance
let instance = null;

export const initEndOfDay = (store) => {
  if (!instance) {
    instance = new EndOfDay(store);
  }
  return instance;
};

export const getEndOfDay = () => {
  if (!instance) {
    throw new Error('EndOfDay not initialized. Call initEndOfDay(store) first.');
  }
  return instance;
};

export default EndOfDay;
