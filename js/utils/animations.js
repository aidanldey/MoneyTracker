/**
 * Animation Utilities
 * Provides helpers for micro-interactions and animations
 */

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Toast Notification System
 */
class ToastManager {
  constructor() {
    this.toasts = [];
    this.container = null;
  }

  /**
   * Show a toast notification
   * @param {string} message - Toast message
   * @param {Object} options - Toast options
   */
  show(message, options = {}) {
    const {
      type = 'info', // 'success', 'error', 'warning', 'info'
      title = '',
      duration = 4000,
      closable = true
    } = options;

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Icon based on type
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    toast.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-message">${message}</div>
      </div>
      ${closable ? '<button class="toast-close" aria-label="Close">×</button>' : ''}
    `;

    // Add to page
    document.body.appendChild(toast);

    // Handle close button
    if (closable) {
      const closeBtn = toast.querySelector('.toast-close');
      closeBtn.addEventListener('click', () => this.hide(toast));
    }

    // Auto hide after duration
    if (duration > 0) {
      setTimeout(() => this.hide(toast), duration);
    }

    // Track toast
    this.toasts.push(toast);

    // Haptic feedback on mobile
    if ('vibrate' in navigator && !prefersReducedMotion()) {
      navigator.vibrate(50);
    }

    return toast;
  }

  /**
   * Hide a toast
   * @param {HTMLElement} toast - Toast element to hide
   */
  hide(toast) {
    toast.classList.add('hiding');

    setTimeout(() => {
      toast.remove();
      this.toasts = this.toasts.filter(t => t !== toast);
    }, 200);
  }

  /**
   * Hide all toasts
   */
  hideAll() {
    this.toasts.forEach(toast => this.hide(toast));
  }
}

// Export singleton instance
export const toast = new ToastManager();

/**
 * Confetti Animation
 */
export function showConfetti(duration = 3000) {
  if (prefersReducedMotion()) return;

  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);

  // Create confetti pieces
  const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const pieceCount = 100;

  for (let i = 0; i < pieceCount; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.top = `-10px`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${Math.random() * 0.5}s`;
    piece.style.animationDuration = `${2 + Math.random()}s`;

    container.appendChild(piece);
  }

  // Remove container after animation
  setTimeout(() => {
    container.remove();
  }, duration);

  // Haptic feedback
  if ('vibrate' in navigator) {
    navigator.vibrate([100, 50, 100]);
  }
}

/**
 * Show celebration overlay
 */
export function showCelebration(options = {}) {
  if (prefersReducedMotion()) {
    // Just show a simple toast instead
    toast.show(options.message || 'Great job!', { type: 'success', title: options.title });
    return;
  }

  const {
    icon = '🎉',
    title = 'Congratulations!',
    message = 'You did it!',
    duration = 3000
  } = options;

  const overlay = document.createElement('div');
  overlay.className = 'celebration-overlay';
  overlay.innerHTML = `
    <div class="celebration-content">
      <div class="celebration-icon">${icon}</div>
      <div class="celebration-title">${title}</div>
      <div class="celebration-message">${message}</div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Show confetti
  showConfetti(duration);

  // Remove overlay after duration
  setTimeout(() => {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 300);
  }, duration);

  // Haptic feedback
  if ('vibrate' in navigator) {
    navigator.vibrate([200, 100, 200]);
  }
}

/**
 * Animate number count-up
 * @param {HTMLElement} element - Element containing the number
 * @param {number} target - Target number
 * @param {number} duration - Animation duration in ms
 */
export function animateNumber(element, target, duration = 800) {
  if (prefersReducedMotion()) {
    element.textContent = target.toFixed(2);
    return;
  }

  const start = parseFloat(element.textContent.replace(/[^0-9.-]/g, '')) || 0;
  const increment = (target - start) / (duration / 16); // 60fps
  let current = start;

  const animate = () => {
    current += increment;

    if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
      current = target;
      element.textContent = `$${current.toFixed(2)}`;
      element.classList.remove('updating');
      return;
    }

    element.textContent = `$${current.toFixed(2)}`;
    requestAnimationFrame(animate);
  };

  element.classList.add('updating');
  animate();
}

/**
 * Add ripple effect to element
 * @param {HTMLElement} element - Element to add ripple to
 * @param {Event} event - Click event
 */
export function addRipple(element, event) {
  if (prefersReducedMotion()) return;

  const ripple = document.createElement('span');
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  ripple.classList.add('ripple');

  element.appendChild(ripple);

  setTimeout(() => ripple.remove(), 600);
}

/**
 * Trigger haptic feedback (visual indicator on desktop)
 * @param {string} type - 'light', 'medium', 'heavy'
 */
export function hapticFeedback(type = 'light') {
  // On mobile devices with vibration API
  if ('vibrate' in navigator && !prefersReducedMotion()) {
    const patterns = {
      light: 10,
      medium: 50,
      heavy: 100
    };
    navigator.vibrate(patterns[type] || 10);
  }
}

/**
 * Animate value change in hero section
 * @param {HTMLElement} element - Hero amount element
 * @param {number} newValue - New value
 * @param {number} oldValue - Old value
 */
export function animateHeroAmount(element, newValue, oldValue) {
  if (prefersReducedMotion()) {
    element.textContent = `$${newValue.toFixed(2)}`;
    return;
  }

  // Add appropriate class based on change
  element.classList.remove('increasing', 'decreasing');

  if (newValue > oldValue) {
    element.classList.add('increasing');
  } else if (newValue < oldValue) {
    element.classList.add('decreasing');
  }

  // Animate the number
  animateNumber(element, newValue);

  // Remove class after animation
  setTimeout(() => {
    element.classList.remove('increasing', 'decreasing');
  }, 500);

  // Haptic feedback
  hapticFeedback(newValue > oldValue ? 'light' : 'medium');
}

/**
 * Show skeleton loading state
 * @param {HTMLElement} container - Container to show skeleton in
 * @param {string} type - Type of skeleton ('card', 'expense', 'text')
 * @param {number} count - Number of skeletons to show
 */
export function showSkeleton(container, type = 'text', count = 3) {
  container.innerHTML = '';

  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = `skeleton skeleton-${type}`;
    container.appendChild(skeleton);
  }
}

/**
 * Hide skeleton and show content
 * @param {HTMLElement} container - Container with skeleton
 * @param {string} content - HTML content to show
 */
export function hideSkeleton(container, content) {
  container.innerHTML = content;

  if (!prefersReducedMotion()) {
    container.classList.add('fade-in');
    setTimeout(() => container.classList.remove('fade-in'), 300);
  }
}

/**
 * Animate expense item removal
 * @param {HTMLElement} element - Expense item element
 * @param {Function} callback - Callback after animation
 */
export function animateRemoval(element, callback) {
  if (prefersReducedMotion()) {
    callback();
    return;
  }

  element.classList.add('removing');

  setTimeout(() => {
    callback();
  }, 200);
}

/**
 * Pull to refresh handler
 */
export class PullToRefresh {
  constructor(onRefresh) {
    this.onRefresh = onRefresh;
    this.startY = 0;
    this.currentY = 0;
    this.isDragging = false;
    this.threshold = 80;
    this.indicator = null;

    this.init();
  }

  init() {
    // Create indicator
    this.indicator = document.createElement('div');
    this.indicator.className = 'pull-to-refresh';
    this.indicator.innerHTML = '↓';
    document.body.appendChild(this.indicator);

    // Add touch event listeners
    document.addEventListener('touchstart', this.handleTouchStart.bind(this));
    document.addEventListener('touchmove', this.handleTouchMove.bind(this));
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  handleTouchStart(e) {
    if (window.scrollY === 0) {
      this.startY = e.touches[0].pageY;
      this.isDragging = true;
    }
  }

  handleTouchMove(e) {
    if (!this.isDragging) return;

    this.currentY = e.touches[0].pageY;
    const distance = this.currentY - this.startY;

    if (distance > 0 && distance < this.threshold * 2) {
      e.preventDefault();
      const progress = Math.min(distance / this.threshold, 1);
      this.indicator.style.top = `${-60 + (60 + 20) * progress}px`;
      this.indicator.style.opacity = progress;
    }
  }

  async handleTouchEnd() {
    if (!this.isDragging) return;

    const distance = this.currentY - this.startY;
    this.isDragging = false;

    if (distance >= this.threshold) {
      // Trigger refresh
      this.indicator.classList.add('active');
      this.indicator.innerHTML = '↻';

      await this.onRefresh();

      // Reset indicator
      setTimeout(() => {
        this.indicator.classList.remove('active');
        this.indicator.style.top = '-60px';
        this.indicator.style.opacity = '0';
        this.indicator.innerHTML = '↓';
      }, 500);
    } else {
      // Reset indicator
      this.indicator.style.top = '-60px';
      this.indicator.style.opacity = '0';
    }

    this.startY = 0;
    this.currentY = 0;
  }

  destroy() {
    this.indicator?.remove();
    document.removeEventListener('touchstart', this.handleTouchStart);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
  }
}

/**
 * Add swipe gestures to element
 * @param {HTMLElement} element - Element to add swipe to
 * @param {Object} callbacks - { onSwipeLeft, onSwipeRight }
 */
export function addSwipeGestures(element, callbacks) {
  let startX = 0;
  let currentX = 0;
  let isDragging = false;

  element.addEventListener('touchstart', (e) => {
    startX = e.touches[0].pageX;
    isDragging = true;
  });

  element.addEventListener('touchmove', (e) => {
    if (!isDragging) return;

    currentX = e.touches[0].pageX;
    const distance = currentX - startX;

    if (Math.abs(distance) > 10) {
      e.preventDefault();

      if (distance < 0) {
        element.classList.add('swipe-left');
        element.classList.remove('swipe-right');
      } else {
        element.classList.add('swipe-right');
        element.classList.remove('swipe-left');
      }
    }
  });

  element.addEventListener('touchend', () => {
    if (!isDragging) return;

    const distance = currentX - startX;

    if (Math.abs(distance) > 100) {
      if (distance < 0 && callbacks.onSwipeLeft) {
        callbacks.onSwipeLeft();
      } else if (distance > 0 && callbacks.onSwipeRight) {
        callbacks.onSwipeRight();
      }
    }

    element.classList.remove('swipe-left', 'swipe-right');
    isDragging = false;
    startX = 0;
    currentX = 0;
  });
}
