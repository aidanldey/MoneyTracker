# Testing Guide - Daily Budget Tracker

Comprehensive testing checklist and procedures for the Daily Budget Tracker.

## Testing Checklist

### ✅ Core Functionality

#### Income Setup
- [ ] Can set one-time income amount
- [ ] Can set income duration (days to last)
- [ ] Calculates daily budget correctly (income / days)
- [ ] Validates input (no negative numbers, required fields)
- [ ] Can modify income settings
- [ ] Updates all dependent calculations when changed
- [ ] Persists income data in localStorage

**Test Case:**
```
1. Set income: $1400, Days: 14
2. Verify daily budget: $100/day
3. Modify to $2100, 14 days
4. Verify daily budget updated to $150/day
```

#### Expense Tracking
- [ ] Can add one-time expense
- [ ] Can add expense with description
- [ ] Can categorize expenses (8 categories)
- [ ] Can add custom category name
- [ ] Amount validation (positive numbers only)
- [ ] Expense appears in today's list
- [ ] Updates remaining balance immediately
- [ ] Updates total spent correctly
- [ ] Can delete expense from list
- [ ] Expense persists after page reload

**Test Case:**
```
1. Add expense: $25, "Groceries", Food category
2. Verify appears in today's expenses
3. Verify remaining balance decreased by $25
4. Verify category badge displays
5. Reload page, verify expense persists
6. Delete expense, verify balance restored
```

#### Budget Calculations
- [ ] Daily budget = Income / Days
- [ ] Remaining today = Daily budget - Today's spent
- [ ] Total balance = Income - All expenses
- [ ] Days remaining calculated correctly
- [ ] End date calculated correctly from start date + days
- [ ] Status indicator changes color based on budget status
  - Green: > 50% remaining
  - Yellow: 20-50% remaining
  - Red: < 20% remaining

**Test Case:**
```
Income: $1400, Days: 14 (Daily: $100)
Day 1: Spend $40 → Remaining: $60 (60%, Green)
Day 1: Spend another $50 → Remaining: $10 (10%, Red)
```

#### Initial Expenses (Committed Funds)
- [ ] Can add initial expense (bill/obligation)
- [ ] Appears in committed funds card
- [ ] Reduces available funds for daily budget
- [ ] Can mark as paid
- [ ] Can edit initial expense
- [ ] Can delete initial expense
- [ ] Shows unpaid count correctly
- [ ] Preserves across pay periods

**Test Case:**
```
1. Income $1400, Days 14
2. Add rent: $700 (due date set)
3. Verify daily budget: ($1400 - $700) / 14 = $50/day
4. Mark rent as paid
5. Verify committed funds reduced
```

#### End-of-Day Reconciliation
- [ ] Opens modal at day end
- [ ] Shows leftover funds scenario when under budget
- [ ] Shows overspent scenario when over budget
- [ ] "Add to Savings" - moves leftover to savings fund
- [ ] "Redistribute" - spreads leftover across remaining days
- [ ] "Leave in Balance" - keeps as cushion
- [ ] "Use Savings" - covers overspending from savings
- [ ] "Adjust Budget" - reduces future daily budgets
- [ ] Updates all calculations correctly
- [ ] Can be manually triggered

**Test Cases:**
```
LEFTOVER SCENARIO:
- Daily budget: $100, Spent: $70
- Leftover: $30
- Test each option:
  * Add to Savings → Savings +$30
  * Redistribute → Daily budget increases
  * Leave in Balance → Total balance unchanged

OVERSPENT SCENARIO:
- Daily budget: $100, Spent: $130
- Overspent: $30
- Test each option:
  * Use Savings → Savings -$30
  * Adjust Budget → Future daily budget decreases
```

#### Savings Fund
- [ ] Can add money to savings from balance
- [ ] Can withdraw money from savings
- [ ] Withdraw options: "Today only" or "Redistribute"
- [ ] Shows max available for each operation
- [ ] Updates savings fund amount
- [ ] Updates total balance
- [ ] Tracks savings history
- [ ] Prevents withdrawing more than available
- [ ] Prevents adding more than available balance

**Test Case:**
```
1. Current balance: $500, Savings: $100
2. Add $200 to savings
3. Verify balance: $300, Savings: $300
4. Withdraw $100 for "Today only"
5. Verify balance: $400, Savings: $200
```

#### Category Management
- [ ] 8 predefined categories available
- [ ] Can add custom category name
- [ ] Category badge displays on expense
- [ ] Can filter expenses by category
- [ ] Category breakdown shows percentages
- [ ] Uncategorized expenses tracked separately
- [ ] Category data in exports

**Test Case:**
```
1. Add 3 Food expenses: $20, $30, $50 (Total: $100)
2. Add 1 Transport expense: $25
3. View category breakdown
4. Verify Food: $100 (80%), Transport: $25 (20%)
5. Filter by Food category
6. Verify only Food expenses shown
```

#### Expense History
- [ ] Level 1: Shows total spent this cycle
- [ ] Level 2: Shows weekly/daily breakdown
- [ ] Level 3: Shows category breakdown with %
- [ ] Level 4: Full list with search/filter/sort
- [ ] Search by description works
- [ ] Filter by category works
- [ ] Sort by date (asc/desc) works
- [ ] Sort by amount (asc/desc) works
- [ ] Can delete expense from history
- [ ] Export to CSV works
- [ ] CSV includes all expense data

**Test Case:**
```
1. Create 20 expenses over 2 weeks
2. Navigate to history
3. Verify weekly groupings correct
4. Search for "groceries"
5. Filter by Food category
6. Sort by amount descending
7. Export to CSV
8. Verify CSV has all fields
```

#### Pay Period Transitions
- [ ] Detects when period ends
- [ ] Shows 3 transition options
- [ ] "Archive and Start Fresh" creates archive
- [ ] Archive includes all period data
- [ ] Option to keep savings fund
- [ ] "Clear and Start Fresh" confirms before clearing
- [ ] "Continue with Current Data" rolls over balance
- [ ] Archive viewer shows all archived periods
- [ ] Can view archive details
- [ ] Can export archive to CSV
- [ ] Can delete archive
- [ ] Manual "Start New Period" button works

**Test Case:**
```
1. Reach end of pay period
2. Choose "Archive and Start Fresh"
3. Check "Keep savings fund"
4. Verify archive created with:
   - Period dates
   - All expenses
   - Category breakdown
   - Summary totals
5. Verify new period started
6. Verify savings carried over
7. Verify expenses cleared
```

#### Data Backup/Restore
- [ ] Export creates JSON backup file
- [ ] Filename includes date
- [ ] Backup includes all data
- [ ] Import validates file structure
- [ ] Shows preview before applying
- [ ] "Merge" option combines data
- [ ] "Replace" option overwrites data
- [ ] Replace requires double confirmation
- [ ] Invalid files show error message
- [ ] Tracks last backup date
- [ ] Shows data size
- [ ] Clear all data works with confirmation

**Test Case:**
```
1. Create test data (income, expenses, savings)
2. Export backup
3. Verify filename: budget-backup-YYYY-MM-DD.json
4. Clear browser data
5. Import backup
6. Preview shows correct data
7. Choose "Replace all data"
8. Verify all data restored correctly
```

#### Offline Functionality (PWA)
- [ ] App loads offline after first visit
- [ ] Service worker registers successfully
- [ ] All static assets cached
- [ ] Can add expenses offline
- [ ] Can view history offline
- [ ] Data persists in localStorage
- [ ] Syncs when back online (if backend added)
- [ ] Install banner appears (if not installed)
- [ ] Can install to home screen
- [ ] Installed app works standalone
- [ ] App shortcuts work

**Test Case:**
```
1. Visit app online
2. Wait for service worker registration
3. Turn off network
4. Reload app
5. Verify app loads
6. Add expense
7. View history
8. Turn on network
9. Verify data persisted
```

### 🌐 Cross-Browser Testing

#### Chrome/Edge (Chromium)
- [ ] All features work
- [ ] Animations smooth
- [ ] PWA installable
- [ ] Service worker works
- [ ] IndexedDB/localStorage works
- [ ] Touch events work (mobile)
- [ ] Tested on Windows, Mac, Linux

#### Firefox
- [ ] All features work
- [ ] Animations smooth
- [ ] PWA installable
- [ ] Service worker works
- [ ] localStorage works
- [ ] Touch events work (mobile)

#### Safari (Desktop & Mobile)
- [ ] All features work
- [ ] Animations smooth
- [ ] PWA installable (iOS 11.3+)
- [ ] Service worker works (iOS 11.3+)
- [ ] localStorage works
- [ ] Touch events work
- [ ] Add to Home Screen works
- [ ] Tested on macOS and iOS

#### Samsung Internet
- [ ] All features work
- [ ] Animations smooth
- [ ] PWA installable
- [ ] Service worker works
- [ ] Touch events work

### 📱 Device Testing

#### iPhone (Various Sizes)
- [ ] iPhone SE (375x667) - Small screen
- [ ] iPhone 12/13/14 (390x844) - Standard
- [ ] iPhone 14 Pro Max (430x932) - Large
- [ ] Portrait orientation
- [ ] Landscape orientation (if applicable)
- [ ] Touch targets ≥ 44px
- [ ] Text readable without zoom
- [ ] Buttons accessible
- [ ] Modals scroll properly
- [ ] Safe area insets respected

#### Android (Various Sizes)
- [ ] Small (320x568) - Budget phones
- [ ] Medium (360x640) - Common size
- [ ] Large (412x915) - Flagship phones
- [ ] Tablet (768x1024+)
- [ ] Portrait orientation
- [ ] Landscape orientation
- [ ] Navigation bar handled
- [ ] Status bar colors correct

#### Tablet
- [ ] iPad (768x1024)
- [ ] iPad Pro (1024x1366)
- [ ] Android tablets
- [ ] Layout adapts to larger screen
- [ ] Touch targets appropriate
- [ ] Content not stretched
- [ ] Modals centered properly

#### Desktop
- [ ] 1920x1080 - Full HD
- [ ] 1366x768 - Common laptop
- [ ] 2560x1440 - 2K
- [ ] 3840x2160 - 4K
- [ ] Hover states work
- [ ] Keyboard navigation
- [ ] Mouse interactions
- [ ] Max-width constraints apply

### ⚡ Performance Testing

#### Lighthouse Scores (Target: 90+)
- [ ] Performance: 90+
- [ ] Accessibility: 90+
- [ ] Best Practices: 90+
- [ ] SEO: 90+
- [ ] PWA: Installable

**Run Lighthouse:**
```bash
# Chrome DevTools
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Select categories
4. Generate report

# CLI
npm install -g lighthouse
lighthouse http://localhost:8080 --view
```

#### Performance Metrics
- [ ] First Contentful Paint (FCP) < 1.8s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] Total Blocking Time (TBT) < 200ms
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Speed Index < 3.4s
- [ ] Time to Interactive (TTI) < 3.8s

#### Load Testing
- [ ] Loads with 10 expenses
- [ ] Loads with 100 expenses
- [ ] Loads with 1000+ expenses
- [ ] Search performs well with many expenses
- [ ] Filter performs well with many expenses
- [ ] Animations smooth with many expenses
- [ ] No memory leaks after extended use

**Test Case:**
```javascript
// Generate 1000 test expenses
for (let i = 0; i < 1000; i++) {
  addExpense({
    amount: Math.random() * 100,
    description: `Test expense ${i}`,
    category: categories[i % 8]
  });
}
// Verify app remains responsive
```

#### Network Performance
- [ ] Initial load < 1s (on 3G)
- [ ] App shell loads < 500ms
- [ ] Images optimized
- [ ] CSS minified
- [ ] JavaScript minified
- [ ] Gzip/Brotli compression enabled
- [ ] Service worker caches efficiently

### ♿ Accessibility Testing

#### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Focus indicators visible
- [ ] Modals trap focus
- [ ] Escape closes modals
- [ ] Enter/Space activates buttons
- [ ] Arrow keys for select/radio
- [ ] No keyboard traps
- [ ] Skip links available (if needed)

**Test Sequence:**
```
1. Tab through entire page
2. Verify focus order logical
3. Open modal with keyboard
4. Tab within modal
5. Close with Escape
6. Verify focus returns to trigger
```

#### Screen Reader Compatibility
- [ ] Semantic HTML used
- [ ] ARIA labels on custom elements
- [ ] ARIA live regions for dynamic content
- [ ] Alt text on images/icons
- [ ] Form labels associated
- [ ] Error messages announced
- [ ] Success messages announced
- [ ] Button purposes clear
- [ ] Heading hierarchy correct

**Tested With:**
- [ ] NVDA (Windows)
- [ ] JAWS (Windows)
- [ ] VoiceOver (macOS/iOS)
- [ ] TalkBack (Android)

#### Color Contrast (WCAG AA)
- [ ] Normal text: 4.5:1 minimum
- [ ] Large text: 3:1 minimum
- [ ] UI components: 3:1 minimum
- [ ] Focus indicators: 3:1 minimum
- [ ] Test with color blindness simulators

**Tools:**
- Chrome DevTools Color Contrast
- WebAIM Contrast Checker
- axe DevTools extension

#### Touch Targets
- [ ] All buttons ≥ 44x44px
- [ ] Adequate spacing between targets
- [ ] Easy to tap on mobile
- [ ] No accidental activations
- [ ] Swipe gestures accessible

### 🔍 Edge Cases & Error Handling

#### Data Validation
- [ ] Negative numbers rejected
- [ ] Zero amounts handled
- [ ] Very large numbers (> $1M)
- [ ] Decimal precision (cents)
- [ ] Empty inputs caught
- [ ] Invalid dates rejected
- [ ] XSS attempts sanitized

#### Boundary Conditions
- [ ] Zero days remaining
- [ ] Zero balance
- [ ] Negative balance
- [ ] No expenses yet
- [ ] No income set
- [ ] Empty categories
- [ ] No archives yet
- [ ] Storage quota exceeded

#### Error Recovery
- [ ] localStorage unavailable
- [ ] Service worker fails
- [ ] Import file corrupted
- [ ] Browser closes mid-operation
- [ ] Rapid clicking handled
- [ ] Concurrent operations
- [ ] State corruption recovery

### 📊 Test Data Generator

Create comprehensive test data:

```javascript
// Generate realistic test data
function generateTestData() {
  const income = {
    amount: 2500,
    days: 14,
    startDate: new Date('2025-01-01')
  };

  const categories = ['food', 'transportation', 'utilities', 'entertainment'];
  const expenses = [];

  for (let day = 0; day < 14; day++) {
    const expenseCount = Math.floor(Math.random() * 5) + 1;
    for (let i = 0; i < expenseCount; i++) {
      expenses.push({
        amount: parseFloat((Math.random() * 50 + 5).toFixed(2)),
        description: `Expense ${expenses.length + 1}`,
        category: categories[Math.floor(Math.random() * categories.length)],
        date: new Date('2025-01-01').setDate(1 + day)
      });
    }
  }

  return { income, expenses };
}
```

### 🐛 Known Issues & Limitations

Document any known issues:

- Safari < 11.3: No service worker support
- Internet Explorer: Not supported
- Private browsing: localStorage may not persist
- Very old Android: Limited CSS support

### 📝 Test Report Template

```markdown
# Test Report - [Date]

## Environment
- Browser: [Browser name and version]
- Device: [Device type and model]
- OS: [Operating system and version]

## Test Results
- Tests Run: [Number]
- Tests Passed: [Number]
- Tests Failed: [Number]
- Blockers: [Number]

## Failed Tests
1. [Test name] - [Description of failure]
2. [Test name] - [Description of failure]

## Performance Metrics
- Lighthouse Score: [Score]
- FCP: [Time]
- LCP: [Time]
- CLS: [Score]

## Notes
[Any additional observations]

## Sign-off
Tested by: [Name]
Date: [Date]
```

### 🚀 Pre-Launch Checklist

Before deploying to production:

- [ ] All critical tests pass
- [ ] All P0 bugs fixed
- [ ] Lighthouse score > 90
- [ ] Cross-browser tested
- [ ] Mobile tested
- [ ] Accessibility tested
- [ ] Performance tested
- [ ] Security reviewed
- [ ] Privacy policy in place
- [ ] Terms of service drafted
- [ ] Analytics configured
- [ ] Error logging set up
- [ ] Backup strategy tested
- [ ] Documentation complete
- [ ] README updated
- [ ] CHANGELOG created

### 🔄 Regression Testing

After any code changes, retest:

**Priority 1 (Must test):**
- Add expense
- View balance
- End of day
- Data persistence

**Priority 2 (Should test):**
- All category operations
- History features
- Backup/restore
- Pay period transitions

**Priority 3 (Nice to test):**
- Edge cases
- Error scenarios
- Performance

### 📚 Testing Resources

**Tools:**
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebPageTest](https://www.webpagetest.org/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [BrowserStack](https://www.browserstack.com/) - Cross-browser testing
- [Can I Use](https://caniuse.com/) - Browser support
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

**Documentation:**
- [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Core Web Vitals](https://web.dev/vitals/)
