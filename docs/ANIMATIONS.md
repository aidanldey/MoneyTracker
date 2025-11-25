# Animations & Micro-Interactions Guide

This document explains the animation system and how to use the micro-interactions in the Daily Budget Tracker.

## Overview

The app includes comprehensive animations and micro-interactions designed to enhance user experience while maintaining performance and accessibility.

## Features

### 1. Modal Animations
- **Slide-in from bottom**: Smooth entrance animation for modals
- **Fade overlay**: Background overlay fades in/out
- **Auto-applied**: All modals automatically use these animations

### 2. Button Interactions
- **Press feedback**: Buttons scale down when pressed
- **Hover lift**: Buttons lift slightly on hover
- **Ripple effect**: Material Design-style ripple on click
- **Auto-applied**: All `.btn` classes get these effects

### 3. Card Effects
- **Hover lift**: Cards elevate on hover
- **Shadow enhancement**: Box shadow increases on interaction
- **Auto-applied**: All `.summary-card` classes get these effects

### 4. Toast Notifications

```javascript
import { toast } from './js/utils/animations.js';

// Success toast
toast.show('Expense added successfully!', {
  type: 'success',
  title: 'Success',
  duration: 4000
});

// Error toast
toast.show('Failed to save data', {
  type: 'error',
  title: 'Error',
  duration: 5000
});

// Info toast
toast.show('Your budget has been updated', {
  type: 'info'
});

// Warning toast
toast.show('You are approaching your budget limit', {
  type: 'warning',
  duration: 6000
});
```

### 5. Number Count-Up Animations

```javascript
import { animateNumber, animateHeroAmount } from './js/utils/animations.js';

// Animate a money value
const element = document.querySelector('.money-value');
animateNumber(element, 1234.56, 800); // animates to $1234.56 over 800ms

// Animate hero amount with special effects
const heroElement = document.querySelector('.hero-amount');
animateHeroAmount(heroElement, 500.00, 300.00); // shows increasing animation
```

### 6. Celebration Animations

```javascript
import { showConfetti, showCelebration } from './js/utils/animations.js';

// Show confetti only
showConfetti(3000); // shows for 3 seconds

// Show full celebration
showCelebration({
  icon: '🎉',
  title: 'Goal Reached!',
  message: 'You saved $1000 this month!',
  duration: 3000
});
```

### 7. Skeleton Loading States

```javascript
import { showSkeleton, hideSkeleton } from './js/utils/animations.js';

const container = document.querySelector('.expense-list');

// Show skeleton while loading
showSkeleton(container, 'expense', 5); // 5 expense skeletons

// Hide skeleton and show content
fetch('/api/expenses')
  .then(response => response.json())
  .then(data => {
    const html = data.map(exp => createExpenseHTML(exp)).join('');
    hideSkeleton(container, html);
  });
```

### 8. Swipe Gestures

```javascript
import { addSwipeGestures } from './js/utils/animations.js';

const expenseItem = document.querySelector('.expense-item');

addSwipeGestures(expenseItem, {
  onSwipeLeft: () => {
    // Delete action
    console.log('Delete expense');
  },
  onSwipeRight: () => {
    // Edit action
    console.log('Edit expense');
  }
});
```

### 9. Pull to Refresh

```javascript
import { PullToRefresh } from './js/utils/animations.js';

const ptr = new PullToRefresh(async () => {
  // Refresh logic
  await fetchLatestData();
  renderDashboard();
});

// Later, to destroy:
// ptr.destroy();
```

### 10. Haptic Feedback

```javascript
import { hapticFeedback } from './js/utils/animations.js';

// Light feedback (10ms vibration)
hapticFeedback('light');

// Medium feedback (50ms vibration)
hapticFeedback('medium');

// Heavy feedback (100ms vibration)
hapticFeedback('heavy');
```

## CSS Classes

### Utility Classes

```html
<!-- Fade in animation -->
<div class="fade-in">Content</div>

<!-- Scale in animation -->
<div class="scale-in">Content</div>

<!-- Fade out animation -->
<div class="fade-out">Content</div>
```

### Skeleton Loading

```html
<!-- Skeleton text -->
<div class="skeleton skeleton-text"></div>

<!-- Skeleton heading -->
<div class="skeleton skeleton-heading"></div>

<!-- Skeleton card -->
<div class="skeleton skeleton-card"></div>

<!-- Skeleton expense item -->
<div class="skeleton skeleton-expense"></div>
```

### State Classes

```html
<!-- Updating value (with celebrate animation) -->
<span class="money-value updating">$100.00</span>

<!-- Hero amount states -->
<span class="hero-amount increasing">$500.00</span>
<span class="hero-amount decreasing">$200.00</span>

<!-- Expense removal -->
<div class="expense-item removing">...</div>
```

## Performance

All animations follow best practices for performance:

- **CSS Transforms**: Use `transform` and `opacity` for animations
- **will-change**: Applied to frequently animated elements
- **GPU Acceleration**: Transforms trigger GPU acceleration
- **RequestAnimationFrame**: JavaScript animations use RAF

## Accessibility

The animation system respects user preferences:

### Reduced Motion

Users who prefer reduced motion (via `prefers-reduced-motion` media query) automatically get:
- Minimal or no animations
- Instant state transitions
- No confetti or celebration effects
- Simplified toast notifications

### Implementation

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

```javascript
import { prefersReducedMotion } from './js/utils/animations.js';

if (prefersReducedMotion()) {
  // Skip animations
} else {
  // Show animations
}
```

## Animation Reference

### Keyframes Available

- `slideInFromBottom` - Slide up from bottom
- `slideInFromTop` - Slide down from top
- `fadeIn` - Fade in
- `fadeOut` - Fade out
- `scaleIn` - Scale up with fade
- `pulse` - Opacity pulse
- `bounce` - Vertical bounce
- `shake` - Horizontal shake
- `ripple` - Ripple expansion
- `slideToast` - Toast slide from right
- `shimmer` - Skeleton shimmer effect
- `confetti` - Confetti fall and rotate
- `celebrate` - Scale celebration
- `spin` - Rotation

### Timing Functions

- **Ease Out**: `cubic-bezier(0.4, 0, 0.2, 1)` - Natural deceleration
- **Bounce**: `cubic-bezier(0.34, 1.56, 0.64, 1)` - Playful bounce
- **Ease**: Default easing for most transitions

## Example Integration

Here's how to integrate animations into a feature:

```javascript
import { toast, animateNumber, showCelebration } from './js/utils/animations.js';

class ExpenseManager {
  async addExpense(expense) {
    try {
      // Show loading state
      showSkeleton(this.container, 'expense', 1);

      // Save expense
      await saveExpense(expense);

      // Update UI
      this.render();

      // Show success toast
      toast.show('Expense added successfully!', {
        type: 'success',
        title: 'Success'
      });

      // Animate balance change
      const newBalance = calculateBalance();
      animateNumber(this.balanceElement, newBalance);

      // Celebrate if goal reached
      if (newBalance >= this.goal) {
        showCelebration({
          title: 'Goal Reached!',
          message: `You saved $${this.goal}!`
        });
      }
    } catch (error) {
      toast.show('Failed to add expense', {
        type: 'error',
        title: 'Error'
      });
    }
  }
}
```

## Testing

To test animations:

1. **Visual Testing**: Open the app and interact with elements
2. **Reduced Motion**: Enable in system settings and verify animations are minimal
3. **Mobile**: Test on mobile devices for haptic feedback and touch gestures
4. **Performance**: Use Chrome DevTools Performance tab to check for jank

## Browser Support

- **Modern Browsers**: Full support (Chrome, Firefox, Safari, Edge)
- **Mobile**: iOS Safari 12+, Chrome Android 80+
- **Vibration API**: Android Chrome, Firefox Mobile (iOS doesn't support)
- **Fallbacks**: All animations degrade gracefully

## Best Practices

1. **Don't Overuse**: Subtle animations work best
2. **Purpose**: Every animation should have a purpose
3. **Feedback**: Use animations for user feedback
4. **Performance**: Monitor animation performance
5. **Accessibility**: Always respect reduced motion preferences
6. **Consistency**: Use consistent timing and easing

## Future Enhancements

Potential additions:
- Page transition animations
- Advanced gesture controls
- Custom easing curves
- Animation presets
- Timeline-based animations
- Parallax effects
