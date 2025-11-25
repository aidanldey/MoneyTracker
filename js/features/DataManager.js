/**
 * Data Manager Feature
 * Daily Budget Tracker
 *
 * Handles data backup, restore, and management functionality.
 * Allows users to export, import, and manage their budget data.
 */

import store from '../state/BudgetStore.js';
import { formatDate, getToday } from '../utils/dateUtils.js';
import { formatMoney } from '../utils/moneyUtils.js';

/**
 * DataManager class manages data backup and restore
 */
export class DataManager {
  constructor() {
    // Get DOM elements
    this.modal = document.getElementById('data-manager-modal');

    if (this.modal) {
      this.overlay = this.modal.querySelector('.modal-overlay');
      this.closeButtons = this.modal.querySelectorAll('[data-action="close-modal"]');

      // Button elements
      this.exportBtn = document.getElementById('export-backup-btn');
      this.importBtn = document.getElementById('import-backup-btn');
      this.clearDataBtn = document.getElementById('clear-data-btn');
      this.fileInput = document.getElementById('backup-file-input');

      // Info elements
      this.backupInfoEl = document.getElementById('backup-info');
      this.lastBackupEl = document.getElementById('last-backup-date');
      this.dataSizeEl = document.getElementById('data-size');

      // Preview elements
      this.previewSection = document.getElementById('import-preview');
      this.previewContent = document.getElementById('preview-content');
      this.mergeBtn = document.getElementById('merge-data-btn');
      this.replaceBtn = document.getElementById('replace-data-btn');
      this.cancelPreviewBtn = document.getElementById('cancel-preview-btn');
    }

    // State
    this.pendingImport = null;

    // Bind methods
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.handleExport = this.handleExport.bind(this);
    this.handleImportClick = this.handleImportClick.bind(this);
    this.handleFileSelect = this.handleFileSelect.bind(this);
    this.handleMerge = this.handleMerge.bind(this);
    this.handleReplace = this.handleReplace.bind(this);
    this.handleCancelPreview = this.handleCancelPreview.bind(this);
    this.handleClearData = this.handleClearData.bind(this);

    // Initialize event listeners
    this.initEventListeners();

    // Load last backup info
    this.loadBackupInfo();
  }

  /**
   * Initialize event listeners
   */
  initEventListeners() {
    if (!this.modal) return;

    // Close buttons
    this.closeButtons?.forEach(button => {
      button.addEventListener('click', this.close);
    });

    // Overlay click
    this.overlay?.addEventListener('click', this.close);

    // Action buttons
    this.exportBtn?.addEventListener('click', this.handleExport);
    this.importBtn?.addEventListener('click', this.handleImportClick);
    this.clearDataBtn?.addEventListener('click', this.handleClearData);

    // File input
    this.fileInput?.addEventListener('change', this.handleFileSelect);

    // Preview buttons
    this.mergeBtn?.addEventListener('click', this.handleMerge);
    this.replaceBtn?.addEventListener('click', this.handleReplace);
    this.cancelPreviewBtn?.addEventListener('click', this.handleCancelPreview);

    // Listen for data manager trigger
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="manage-data"]')) {
        this.open();
      }
    });
  }

  /**
   * Open data manager modal
   */
  open() {
    if (!this.modal) return;

    this.updateBackupInfo();
    this.hidePreview();
    this.modal.removeAttribute('hidden');
  }

  /**
   * Close data manager modal
   */
  close() {
    if (!this.modal) return;
    this.modal.setAttribute('hidden', '');
    this.hidePreview();
  }

  /**
   * Load backup info from localStorage
   */
  loadBackupInfo() {
    const backupInfo = localStorage.getItem('lastBackupInfo');
    if (backupInfo) {
      try {
        const info = JSON.parse(backupInfo);
        this.lastBackupDate = new Date(info.date);
      } catch (error) {
        console.error('Error loading backup info:', error);
      }
    }
  }

  /**
   * Save backup info to localStorage
   */
  saveBackupInfo() {
    const info = {
      date: new Date().toISOString()
    };
    localStorage.setItem('lastBackupInfo', JSON.stringify(info));
    this.lastBackupDate = new Date(info.date);
  }

  /**
   * Update backup info display
   */
  updateBackupInfo() {
    if (this.lastBackupEl) {
      if (this.lastBackupDate) {
        this.lastBackupEl.textContent = formatDate(this.lastBackupDate, 'long');
      } else {
        this.lastBackupEl.textContent = 'Never';
      }
    }

    if (this.dataSizeEl) {
      const state = store.getState();
      const dataSize = this.calculateDataSize(state);
      this.dataSizeEl.textContent = this.formatBytes(dataSize);
    }
  }

  /**
   * Calculate data size
   * @param {Object} data - Data to calculate size of
   * @returns {number} Size in bytes
   */
  calculateDataSize(data) {
    const json = JSON.stringify(data);
    return new Blob([json]).size;
  }

  /**
   * Format bytes to human readable
   * @param {number} bytes - Bytes to format
   * @returns {string} Formatted size
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Handle export backup
   */
  handleExport() {
    try {
      const state = store.getState();

      // Create backup object
      const backup = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        appName: 'Daily Budget Tracker',
        data: state
      };

      // Convert to JSON
      const json = JSON.stringify(backup, null, 2);

      // Create blob and download
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `budget-backup-${formatDate(getToday(), 'iso')}.json`;
      link.href = url;
      link.download = filename;
      link.click();

      URL.revokeObjectURL(url);

      // Save backup info
      this.saveBackupInfo();
      this.updateBackupInfo();

      // Show success message
      this.showMessage('Backup exported successfully!', 'success');

      console.log('Backup exported:', filename);
    } catch (error) {
      console.error('Error exporting backup:', error);
      this.showMessage('Failed to export backup. Please try again.', 'error');
    }
  }

  /**
   * Handle import button click
   */
  handleImportClick() {
    this.fileInput?.click();
  }

  /**
   * Handle file select
   * @param {Event} event - Change event
   */
  async handleFileSelect(event) {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    // Reset file input
    event.target.value = '';

    try {
      // Read file
      const text = await this.readFile(file);
      const backup = JSON.parse(text);

      // Validate backup
      const validation = this.validateBackup(backup);

      if (!validation.valid) {
        this.showMessage(validation.error, 'error');
        return;
      }

      // Store pending import
      this.pendingImport = backup;

      // Show preview
      this.showPreview(backup);

    } catch (error) {
      console.error('Error reading backup file:', error);
      this.showMessage('Invalid backup file. Please select a valid backup.', 'error');
    }
  }

  /**
   * Read file as text
   * @param {File} file - File to read
   * @returns {Promise<string>} File text
   */
  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        resolve(e.target.result);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Validate backup file
   * @param {Object} backup - Backup object
   * @returns {Object} Validation result
   */
  validateBackup(backup) {
    if (!backup || typeof backup !== 'object') {
      return { valid: false, error: 'Invalid backup file format' };
    }

    if (!backup.data) {
      return { valid: false, error: 'Backup file is missing data' };
    }

    if (!backup.data.income || !backup.data.budget || !backup.data.expenses) {
      return { valid: false, error: 'Backup file is incomplete or corrupted' };
    }

    return { valid: true };
  }

  /**
   * Show preview of backup
   * @param {Object} backup - Backup object
   */
  showPreview(backup) {
    if (!this.previewSection || !this.previewContent) return;

    const data = backup.data;

    // Calculate stats
    const expenseCount = data.expenses?.length || 0;
    const archiveCount = data.archives?.length || 0;
    const recurringCount = data.recurringExpenses?.length || 0;
    const initialExpenseCount = data.initialExpenses?.items?.length || 0;
    const savingsHistoryCount = data.savingsHistory?.length || 0;

    const currentBalance = data.budget?.currentBalance || 0;
    const savingsFund = data.budget?.savingsFund || 0;

    const exportDate = backup.exportDate
      ? formatDate(new Date(backup.exportDate), 'long')
      : 'Unknown';

    // Render preview
    this.previewContent.innerHTML = `
      <div class="preview-header">
        <h3 class="preview-title">Backup Preview</h3>
        <p class="preview-date">Exported: ${exportDate}</p>
      </div>

      <div class="preview-stats">
        <div class="preview-stat-group">
          <h4>Financial Data</h4>
          <div class="stat-row">
            <span class="stat-label">Current Balance:</span>
            <span class="stat-value money-value">${formatMoney(currentBalance)}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Savings Fund:</span>
            <span class="stat-value money-value">${formatMoney(savingsFund)}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Income Amount:</span>
            <span class="stat-value money-value">${formatMoney(data.income?.amount || 0)}</span>
          </div>
        </div>

        <div class="preview-stat-group">
          <h4>Data Counts</h4>
          <div class="stat-row">
            <span class="stat-label">Expenses:</span>
            <span class="stat-value">${expenseCount}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Recurring Expenses:</span>
            <span class="stat-value">${recurringCount}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Initial Expenses:</span>
            <span class="stat-value">${initialExpenseCount}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Archives:</span>
            <span class="stat-value">${archiveCount}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Savings History:</span>
            <span class="stat-value">${savingsHistoryCount}</span>
          </div>
        </div>
      </div>

      <div class="preview-warning">
        <p><strong>⚠️ Warning:</strong></p>
        <ul>
          <li><strong>Merge:</strong> Combines backup data with existing data (may create duplicates)</li>
          <li><strong>Replace:</strong> Completely replaces all current data (cannot be undone)</li>
        </ul>
      </div>
    `;

    // Show preview section
    this.previewSection.style.display = 'block';
  }

  /**
   * Hide preview section
   */
  hidePreview() {
    if (this.previewSection) {
      this.previewSection.style.display = 'none';
    }
    this.pendingImport = null;
  }

  /**
   * Handle merge data
   */
  handleMerge() {
    if (!this.pendingImport) return;

    const confirmed = confirm(
      'Merge backup data with existing data?\n\n' +
      'This will combine the backup with your current data.\n' +
      'Existing data will not be deleted, but duplicates may occur.'
    );

    if (!confirmed) return;

    try {
      const currentState = store.getState();
      const backupData = this.pendingImport.data;

      // Merge data
      const mergedState = {
        income: backupData.income || currentState.income,
        budget: {
          ...currentState.budget,
          ...backupData.budget
        },
        initialExpenses: {
          fund: currentState.initialExpenses.fund,
          totalCommitted: currentState.initialExpenses.totalCommitted,
          totalPaid: currentState.initialExpenses.totalPaid,
          items: [
            ...(currentState.initialExpenses.items || []),
            ...(backupData.initialExpenses?.items || [])
          ]
        },
        recurringExpenses: [
          ...(currentState.recurringExpenses || []),
          ...(backupData.recurringExpenses || [])
        ],
        expenses: [
          ...(currentState.expenses || []),
          ...(backupData.expenses || [])
        ],
        savingsHistory: [
          ...(currentState.savingsHistory || []),
          ...(backupData.savingsHistory || [])
        ],
        archives: [
          ...(currentState.archives || []),
          ...(backupData.archives || [])
        ],
        ui: currentState.ui
      };

      // Update store
      store.setState(mergedState);

      // Close and refresh
      this.hidePreview();
      this.close();
      this.showMessage('Data merged successfully!', 'success');

      // Refresh app
      document.dispatchEvent(new CustomEvent('budget-updated'));

      console.log('Data merged successfully');
    } catch (error) {
      console.error('Error merging data:', error);
      this.showMessage('Failed to merge data. Please try again.', 'error');
    }
  }

  /**
   * Handle replace data
   */
  handleReplace() {
    if (!this.pendingImport) return;

    const confirmed = confirm(
      '⚠️ REPLACE ALL DATA? ⚠️\n\n' +
      'This will PERMANENTLY DELETE all your current data and replace it with the backup.\n\n' +
      'This action CANNOT be undone!\n\n' +
      'Are you absolutely sure you want to continue?'
    );

    if (!confirmed) return;

    // Double confirmation for destructive action
    const doubleConfirm = confirm(
      'FINAL CONFIRMATION\n\n' +
      'All current data will be permanently deleted.\n\n' +
      'Type OK in your mind and click OK to proceed.'
    );

    if (!doubleConfirm) return;

    try {
      const backupData = this.pendingImport.data;

      // Replace all data
      store.setState(backupData);

      // Close and refresh
      this.hidePreview();
      this.close();
      this.showMessage('Data restored successfully!', 'success');

      // Refresh app
      setTimeout(() => {
        window.location.reload();
      }, 1000);

      console.log('Data replaced successfully');
    } catch (error) {
      console.error('Error replacing data:', error);
      this.showMessage('Failed to restore data. Please try again.', 'error');
    }
  }

  /**
   * Handle cancel preview
   */
  handleCancelPreview() {
    this.hidePreview();
  }

  /**
   * Handle clear all data
   */
  handleClearData() {
    const confirmed = confirm(
      '⚠️ CLEAR ALL DATA? ⚠️\n\n' +
      'This will PERMANENTLY DELETE:\n' +
      '- All expenses\n' +
      '- All income settings\n' +
      '- All recurring expenses\n' +
      '- All archives\n' +
      '- All savings history\n' +
      '- All settings\n\n' +
      'This action CANNOT be undone!\n\n' +
      'Make sure you have a backup before proceeding.'
    );

    if (!confirmed) return;

    // Double confirmation
    const doubleConfirm = confirm(
      'FINAL CONFIRMATION\n\n' +
      'All data will be permanently deleted.\n\n' +
      'Click OK to proceed with clearing all data.'
    );

    if (!doubleConfirm) return;

    try {
      // Reset store to default state
      store.resetState();

      // Close modal
      this.close();

      // Show message and reload
      this.showMessage('All data cleared. Reloading app...', 'success');

      setTimeout(() => {
        window.location.reload();
      }, 1500);

      console.log('All data cleared');
    } catch (error) {
      console.error('Error clearing data:', error);
      this.showMessage('Failed to clear data. Please try again.', 'error');
    }
  }

  /**
   * Show message
   * @param {string} message - Message to show
   * @param {string} type - Message type (success, error, info)
   */
  showMessage(message, type = 'info') {
    const messageEl = document.createElement('div');
    messageEl.className = `toast-message toast-${type}`;

    const bgColors = {
      success: 'var(--color-status-good)',
      error: 'var(--color-status-danger)',
      info: 'var(--color-primary)'
    };

    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: ${bgColors[type]};
      color: white;
      padding: var(--spacing-md) var(--spacing-xl);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      z-index: 10000;
      animation: slideDown 0.3s ease;
      max-width: 90%;
      text-align: center;
    `;

    messageEl.textContent = message;
    document.body.appendChild(messageEl);

    // Remove after 4 seconds
    setTimeout(() => {
      messageEl.style.animation = 'slideUp 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(messageEl);
      }, 300);
    }, 4000);
  }
}

// Singleton instance
let instance = null;

/**
 * Initialize DataManager
 */
export function initDataManager() {
  if (!instance) {
    instance = new DataManager();
  }
  return instance;
}

/**
 * Get DataManager instance
 */
export function getDataManager() {
  return instance;
}

export default DataManager;
