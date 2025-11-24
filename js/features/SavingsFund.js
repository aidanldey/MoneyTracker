/**
 * Savings Fund Feature
 * Daily Budget Tracker
 *
 * Manages savings fund with add/withdraw functionality and history tracking.
 */

import { formatMoney, parseMoney } from '../utils/formatters.js';
import { getToday, formatDate } from '../utils/dateUtils.js';

export class SavingsFund {
  constructor(store) {
    this.store = store;
    this.modal = document.getElementById('savings-modal');
    this.overlay = document.getElementById('savings-overlay');

    // Main view elements
    this.currentSavingsEl = document.getElementById('savings-current-amount');
    this.addMoneyBtn = document.getElementById('savings-add-btn');
    this.withdrawMoneyBtn = document.getElementById('savings-withdraw-btn');
    this.closeBtn = document.getElementById('savings-close-btn');

    // Add money view elements
    this.addView = document.getElementById('savings-add-view');
    this.addAmountInput = document.getElementById('savings-add-amount');
    this.addMaxBtn = document.getElementById('savings-add-max-btn');
    this.addAvailableEl = document.getElementById('savings-add-available');
    this.addPreviewEl = document.getElementById('savings-add-preview');
    this.addConfirmBtn = document.getElementById('savings-add-confirm-btn');
    this.addCancelBtn = document.getElementById('savings-add-cancel-btn');

    // Withdraw money view elements
    this.withdrawView = document.getElementById('savings-withdraw-view');
    this.withdrawAmountInput = document.getElementById('savings-withdraw-amount');
    this.withdrawMaxBtn = document.getElementById('savings-withdraw-max-btn');
    this.withdrawAvailableEl = document.getElementById('savings-withdraw-available');
    this.withdrawPreviewEl = document.getElementById('savings-withdraw-preview');
    this.withdrawTodayRadio = document.getElementById('withdraw-today');
    this.withdrawRedistributeRadio = document.getElementById('withdraw-redistribute');
    this.withdrawConfirmBtn = document.getElementById('savings-withdraw-confirm-btn');
    this.withdrawCancelBtn = document.getElementById('savings-withdraw-cancel-btn');

    // History elements
    this.historyContainer = document.getElementById('savings-history');
    this.historyList = document.getElementById('savings-history-list');

    // Main view container
    this.mainView = document.getElementById('savings-main-view');

    // Current view state
    this.currentView = 'main';

    this.init();
  }

  init() {
    // Bind event listeners
    this.closeBtn?.addEventListener('click', () => this.close());
    this.overlay?.addEventListener('click', () => this.close());

    // Main view buttons
    this.addMoneyBtn?.addEventListener('click', () => this.showAddView());
    this.withdrawMoneyBtn?.addEventListener('click', () => this.showWithdrawView());

    // Add money view
    this.addMaxBtn?.addEventListener('click', () => this.setAddMax());
    this.addAmountInput?.addEventListener('input', () => this.updateAddPreview());
    this.addConfirmBtn?.addEventListener('click', () => this.handleAddMoney());
    this.addCancelBtn?.addEventListener('click', () => this.showMainView());

    // Withdraw money view
    this.withdrawMaxBtn?.addEventListener('click', () => this.setWithdrawMax());
    this.withdrawAmountInput?.addEventListener('input', () => this.updateWithdrawPreview());
    this.withdrawTodayRadio?.addEventListener('change', () => this.updateWithdrawPreview());
    this.withdrawRedistributeRadio?.addEventListener('change', () => this.updateWithdrawPreview());
    this.withdrawConfirmBtn?.addEventListener('click', () => this.handleWithdrawMoney());
    this.withdrawCancelBtn?.addEventListener('click', () => this.showMainView());

    console.log('SavingsFund: Feature initialized');
  }

  /**
   * Open the savings fund modal
   */
  open() {
    this.showMainView();
    this.updateMainView();
    this.renderHistory();

    // Show modal
    this.modal.style.display = 'block';
    this.overlay.style.display = 'block';

    console.log('SavingsFund: Modal opened');
  }

  /**
   * Close the modal
   */
  close() {
    this.modal.style.display = 'none';
    this.overlay.style.display = 'none';
    this.currentView = 'main';
  }

  /**
   * Show main view
   */
  showMainView() {
    this.mainView.style.display = 'block';
    this.addView.style.display = 'none';
    this.withdrawView.style.display = 'none';
    this.currentView = 'main';
    this.updateMainView();
  }

  /**
   * Update main view with current savings
   */
  updateMainView() {
    const state = this.store.getState();
    const currentSavings = state.budget.savingsFund || 0;

    this.currentSavingsEl.textContent = formatMoney(currentSavings);

    // Disable withdraw button if no savings
    if (this.withdrawMoneyBtn) {
      this.withdrawMoneyBtn.disabled = currentSavings === 0;
    }
  }

  /**
   * Show add money view
   */
  showAddView() {
    const state = this.store.getState();
    const availableBalance = state.budget.currentBalance - state.initialExpenses.fund - state.budget.recurringExpenseDeduction;

    // Check if user has available balance
    if (availableBalance <= 0) {
      alert('You have no available balance to add to savings. Your current balance is fully allocated to initial expenses and recurring expenses.');
      return;
    }

    this.mainView.style.display = 'none';
    this.addView.style.display = 'block';
    this.currentView = 'add';

    // Update available balance display
    this.addAvailableEl.textContent = formatMoney(availableBalance);

    // Reset form
    this.addAmountInput.value = '';
    this.addPreviewEl.style.display = 'none';
    this.addConfirmBtn.disabled = true;
  }

  /**
   * Set add amount to max available
   */
  setAddMax() {
    const state = this.store.getState();
    const availableBalance = state.budget.currentBalance - state.initialExpenses.fund - state.budget.recurringExpenseDeduction;

    this.addAmountInput.value = availableBalance.toFixed(2);
    this.updateAddPreview();
  }

  /**
   * Update add money preview
   */
  updateAddPreview() {
    const state = this.store.getState();
    const availableBalance = state.budget.currentBalance - state.initialExpenses.fund - state.budget.recurringExpenseDeduction;
    const amount = parseMoney(this.addAmountInput.value);

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      this.addPreviewEl.style.display = 'none';
      this.addConfirmBtn.disabled = true;
      return;
    }

    if (amount > availableBalance) {
      this.addPreviewEl.style.display = 'block';
      this.addPreviewEl.innerHTML = `
        <p class="preview-error">⚠️ Amount exceeds available balance (${formatMoney(availableBalance)})</p>
      `;
      this.addConfirmBtn.disabled = true;
      return;
    }

    // Calculate new daily budget
    const newAvailableBalance = availableBalance - amount;
    const daysRemaining = state.budget.daysRemaining || 1;
    const newDailyBudget = this.store.calculator.calculateDailyBudget(newAvailableBalance, daysRemaining);
    const newSavings = (state.budget.savingsFund || 0) + amount;

    // Show preview
    this.addPreviewEl.style.display = 'block';
    this.addPreviewEl.innerHTML = `
      <div class="preview-row">
        <span>New Savings:</span>
        <span class="money-value">${formatMoney(newSavings)}</span>
      </div>
      <div class="preview-row">
        <span>New Daily Budget:</span>
        <span class="money-value">${formatMoney(newDailyBudget)}</span>
      </div>
    `;

    this.addConfirmBtn.disabled = false;
  }

  /**
   * Handle add money confirmation
   */
  handleAddMoney() {
    const state = this.store.getState();
    const amount = parseMoney(this.addAmountInput.value);
    const availableBalance = state.budget.currentBalance - state.initialExpenses.fund - state.budget.recurringExpenseDeduction;

    // Validate
    if (isNaN(amount) || amount <= 0 || amount > availableBalance) {
      alert('Invalid amount');
      return;
    }

    // Calculate new values
    const newSavings = (state.budget.savingsFund || 0) + amount;
    const newBalance = state.budget.currentBalance - amount;
    const newAvailableBalance = availableBalance - amount;
    const daysRemaining = state.budget.daysRemaining || 1;
    const newDailyBudget = this.store.calculator.calculateDailyBudget(newAvailableBalance, daysRemaining);

    // Get or initialize savings history
    const savingsHistory = state.savingsHistory || [];

    // Add history entry
    const historyEntry = {
      id: Date.now().toString(),
      date: getToday(),
      type: 'add',
      amount: amount,
      savingsAfter: newSavings,
      timestamp: Date.now()
    };

    // Update state
    this.store.setState({
      budget: {
        ...state.budget,
        savingsFund: newSavings,
        currentBalance: newBalance,
        dailyBudget: newDailyBudget
      },
      savingsHistory: [...savingsHistory, historyEntry]
    });

    console.log('SavingsFund: Added money', {
      amount: formatMoney(amount),
      newSavings: formatMoney(newSavings),
      newDailyBudget: formatMoney(newDailyBudget)
    });

    // Show main view
    this.showMainView();
    this.renderHistory();

    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('savings-updated'));
  }

  /**
   * Show withdraw money view
   */
  showWithdrawView() {
    const state = this.store.getState();
    const currentSavings = state.budget.savingsFund || 0;

    if (currentSavings === 0) {
      alert('You have no savings to withdraw.');
      return;
    }

    this.mainView.style.display = 'none';
    this.withdrawView.style.display = 'block';
    this.currentView = 'withdraw';

    // Update available savings display
    this.withdrawAvailableEl.textContent = formatMoney(currentSavings);

    // Reset form
    this.withdrawAmountInput.value = '';
    this.withdrawTodayRadio.checked = true;
    this.withdrawPreviewEl.style.display = 'none';
    this.withdrawConfirmBtn.disabled = true;
  }

  /**
   * Set withdraw amount to max available
   */
  setWithdrawMax() {
    const state = this.store.getState();
    const currentSavings = state.budget.savingsFund || 0;

    this.withdrawAmountInput.value = currentSavings.toFixed(2);
    this.updateWithdrawPreview();
  }

  /**
   * Update withdraw money preview
   */
  updateWithdrawPreview() {
    const state = this.store.getState();
    const currentSavings = state.budget.savingsFund || 0;
    const amount = parseMoney(this.withdrawAmountInput.value);
    const addToToday = this.withdrawTodayRadio.checked;

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      this.withdrawPreviewEl.style.display = 'none';
      this.withdrawConfirmBtn.disabled = true;
      return;
    }

    if (amount > currentSavings) {
      this.withdrawPreviewEl.style.display = 'block';
      this.withdrawPreviewEl.innerHTML = `
        <p class="preview-error">⚠️ Amount exceeds available savings (${formatMoney(currentSavings)})</p>
      `;
      this.withdrawConfirmBtn.disabled = true;
      return;
    }

    // Calculate new values
    const newSavings = currentSavings - amount;
    const newBalance = state.budget.currentBalance + amount;
    const daysRemaining = state.budget.daysRemaining || 1;
    const availableBalance = newBalance - state.initialExpenses.fund - state.budget.recurringExpenseDeduction;

    let newDailyBudget;
    let previewText;

    if (addToToday) {
      // Add to today only - daily budget stays the same
      newDailyBudget = state.budget.dailyBudget;
      const newRemainingToday = state.budget.dailyBudget - state.budget.todaySpent + amount;
      previewText = `
        <div class="preview-row">
          <span>New Savings:</span>
          <span class="money-value">${formatMoney(newSavings)}</span>
        </div>
        <div class="preview-row">
          <span>Remaining Today:</span>
          <span class="money-value">${formatMoney(newRemainingToday)}</span>
        </div>
        <p class="preview-note">Daily budget remains ${formatMoney(newDailyBudget)}</p>
      `;
    } else {
      // Redistribute - recalculate daily budget
      newDailyBudget = this.store.calculator.calculateDailyBudget(availableBalance, daysRemaining);
      previewText = `
        <div class="preview-row">
          <span>New Savings:</span>
          <span class="money-value">${formatMoney(newSavings)}</span>
        </div>
        <div class="preview-row">
          <span>New Daily Budget:</span>
          <span class="money-value">${formatMoney(newDailyBudget)}</span>
        </div>
        <p class="preview-note">Spread across ${daysRemaining} remaining days</p>
      `;
    }

    // Show preview
    this.withdrawPreviewEl.style.display = 'block';
    this.withdrawPreviewEl.innerHTML = previewText;

    this.withdrawConfirmBtn.disabled = false;
  }

  /**
   * Handle withdraw money confirmation
   */
  handleWithdrawMoney() {
    const state = this.store.getState();
    const amount = parseMoney(this.withdrawAmountInput.value);
    const currentSavings = state.budget.savingsFund || 0;
    const addToToday = this.withdrawTodayRadio.checked;

    // Validate
    if (isNaN(amount) || amount <= 0 || amount > currentSavings) {
      alert('Invalid amount');
      return;
    }

    // Calculate new values
    const newSavings = currentSavings - amount;
    const newBalance = state.budget.currentBalance + amount;

    let newDailyBudget;

    if (addToToday) {
      // Add to today only - daily budget stays the same, just add to balance
      newDailyBudget = state.budget.dailyBudget;
    } else {
      // Redistribute - recalculate daily budget
      const daysRemaining = state.budget.daysRemaining || 1;
      const availableBalance = newBalance - state.initialExpenses.fund - state.budget.recurringExpenseDeduction;
      newDailyBudget = this.store.calculator.calculateDailyBudget(availableBalance, daysRemaining);
    }

    // Get or initialize savings history
    const savingsHistory = state.savingsHistory || [];

    // Add history entry
    const historyEntry = {
      id: Date.now().toString(),
      date: getToday(),
      type: 'withdraw',
      amount: amount,
      redistributed: !addToToday,
      savingsAfter: newSavings,
      timestamp: Date.now()
    };

    // Update state
    this.store.setState({
      budget: {
        ...state.budget,
        savingsFund: newSavings,
        currentBalance: newBalance,
        dailyBudget: newDailyBudget
      },
      savingsHistory: [...savingsHistory, historyEntry]
    });

    console.log('SavingsFund: Withdrew money', {
      amount: formatMoney(amount),
      addToToday,
      newSavings: formatMoney(newSavings),
      newDailyBudget: formatMoney(newDailyBudget)
    });

    // Show main view
    this.showMainView();
    this.renderHistory();

    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('savings-updated'));
  }

  /**
   * Render savings history
   */
  renderHistory() {
    const state = this.store.getState();
    const history = state.savingsHistory || [];

    if (history.length === 0) {
      this.historyContainer.style.display = 'none';
      return;
    }

    this.historyContainer.style.display = 'block';

    // Sort by timestamp descending (newest first)
    const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);

    // Render history items
    this.historyList.innerHTML = sortedHistory.map(entry => {
      const icon = entry.type === 'add' ? '➕' : '➖';
      const typeLabel = entry.type === 'add' ? 'Added' : 'Withdrew';
      const typeClass = entry.type === 'add' ? 'add' : 'withdraw';
      const redistributedNote = entry.type === 'withdraw' && entry.redistributed
        ? '<span class="history-note">Redistributed to all days</span>'
        : '';

      return `
        <div class="history-item ${typeClass}">
          <div class="history-icon">${icon}</div>
          <div class="history-details">
            <div class="history-main">
              <span class="history-type">${typeLabel}</span>
              <span class="history-amount money-value">${formatMoney(entry.amount)}</span>
            </div>
            <div class="history-meta">
              <span class="history-date">${formatDate(entry.date)}</span>
              ${redistributedNote}
            </div>
            <div class="history-balance">
              Balance after: <span class="money-value">${formatMoney(entry.savingsAfter)}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}

// Export singleton instance
let instance = null;

export const initSavingsFund = (store) => {
  if (!instance) {
    instance = new SavingsFund(store);
  }
  return instance;
};

export const getSavingsFund = () => {
  if (!instance) {
    throw new Error('SavingsFund not initialized. Call initSavingsFund(store) first.');
  }
  return instance;
};

export default SavingsFund;
