# Recurring Expenses Testing Guide

## Feature: Recurring Expense Auto-Deduction (Prompt 2.2)

This document outlines testing scenarios for the recurring expenses feature with automatic deduction at cycle start.

## Core Concept

Recurring expenses are **automatically deducted from your starting balance BEFORE calculating your daily budget**. This ensures you have enough money for bills that happen multiple times during your pay cycle.

### Formula
```
Daily Budget = (Balance - Initial Expenses Fund - Recurring Expense Deduction) / Days Remaining
```

### Example
- Income: $1,000
- Days: 30
- Recurring: Netflix $15/month (1 occurrence) + Gym $30/month (1 occurrence) = $45
- Initial Expenses: Rent $600 (reserved, not deducted yet)
- **Calculation:**
  - Available after recurring: $1,000 - $45 = $955
  - Available after initial expenses: $955 - $600 = $355
  - Daily budget: $355 / 30 = $11.83/day

---

## Test Scenarios

### Scenario 1: Monthly Recurring Expense (Single Occurrence)
**Setup:**
1. Set income: $1,000, 30 days
2. Add recurring expense: Netflix $15, Monthly, starts today

**Expected Results:**
- Occurrences in cycle: 1 (today)
- Total deduction: $15
- Available balance: $985
- Daily budget: $985 / 30 = $32.83/day
- Console shows: "Applied recurring expenses: 1 active, $15.00 deduction"

---

### Scenario 2: Weekly Recurring Expense (Multiple Occurrences)
**Setup:**
1. Set income: $1,000, 28 days (4 weeks)
2. Add recurring expense: Coffee $10, Weekly, starts today

**Expected Results:**
- Occurrences in cycle: 4 (Days 1, 8, 15, 22)
- Total deduction: $40
- Available balance: $960
- Daily budget: $960 / 28 = $34.29/day
- Preview shows: "Weekly • 4 occurrences this cycle = $40.00 total"

---

### Scenario 3: Bi-Weekly Recurring Expense
**Setup:**
1. Set income: $1,500, 28 days
2. Add recurring expense: Meal Kit $60, Bi-Weekly, starts today

**Expected Results:**
- Occurrences in cycle: 2 (Days 1 and 15)
- Total deduction: $120
- Available balance: $1,380
- Daily budget: $1,380 / 28 = $49.29/day

---

### Scenario 4: Daily Recurring Expense
**Setup:**
1. Set income: $2,000, 30 days
2. Add recurring expense: Public Transit $5, Daily, starts today

**Expected Results:**
- Occurrences in cycle: 30 (every day)
- Total deduction: $150
- Available balance: $1,850
- Daily budget: $1,850 / 30 = $61.67/day

---

### Scenario 5: Yearly Recurring Expense (Prorated)
**Setup:**
1. Set income: $1,000, 365 days (full year)
2. Add recurring expense: Domain Renewal $15, Yearly, starts today

**Expected Results:**
- Occurrences in cycle: 1 (today)
- Total deduction: $15
- Available balance: $985
- Daily budget: $985 / 365 = $2.70/day

---

### Scenario 6: Multiple Recurring Expenses
**Setup:**
1. Set income: $2,000, 30 days
2. Add recurring expenses:
   - Netflix $15, Monthly
   - Gym $30, Monthly
   - Spotify $10, Monthly
   - Phone $50, Monthly

**Expected Results:**
- Total occurrences: 4
- Total deduction: $105
- Available balance: $1,895
- Daily budget: $1,895 / 30 = $63.17/day
- All 4 expenses counted as active

---

### Scenario 7: Recurring Expense with End Date
**Setup:**
1. Set income: $1,000, 60 days
2. Add recurring expense: Trial Subscription $20, Monthly
   - Start: Today
   - End: 30 days from now

**Expected Results:**
- Occurrences in 60-day cycle: 2 (Days 1 and 31, but end date stops it)
- Actual occurrences: 1 (only Day 1 before end date)
- Total deduction: $20
- Available balance: $980
- Daily budget: $980 / 60 = $16.33/day

---

### Scenario 8: Recurring Expense Starting Mid-Cycle
**Setup:**
1. Set income: $1,000, 30 days (today to day 30)
2. Add recurring expense: Monthly Bill $50, Monthly
   - Start: Day 15

**Expected Results:**
- Occurrences: 1 (Day 15)
- Total deduction: $50
- Available balance: $950
- Daily budget: $950 / 30 = $31.67/day
- Preview shows: "Monthly • 1 occurrence this cycle = $50.00 total"

---

### Scenario 9: Recurring + Initial Expenses Combined
**Setup:**
1. Set income: $2,000, 30 days
2. Add initial expense: Rent $800 (reserved)
3. Add recurring expense: Utilities $100, Monthly

**Expected Results:**
- Recurring deduction: $100
- After recurring: $1,900
- Initial expenses fund: $800
- Available for daily: $1,100
- Daily budget: $1,100 / 30 = $36.67/day
- Committed funds total: $900 ($800 initial + $100 recurring)

---

### Scenario 10: Payday Rollover with Recurring Expenses
**Setup:**
1. Set recurring income: $1,000 Bi-Weekly
2. Add recurring expense: Netflix $15, Monthly
3. Trigger payday rollover

**Expected Results:**
- On rollover:
  - Balance resets to $1,000
  - Recurring expenses recalculated for new 14-day cycle
  - If Netflix already charged this month, 0 occurrences
  - If Netflix due again, 1 occurrence = $15 deduction
- Daily budget recalculated with new deduction
- Console shows: "Applied recurring expenses for new cycle"

---

## Edge Cases

### Edge Case 1: Recurring Expense Larger Than Income
**Setup:**
- Income: $500, 30 days
- Recurring: $600/month

**Expected Results:**
- Total deduction: $600
- Available balance: -$100 (negative)
- Daily budget: -$100 / 30 = -$3.33/day
- **Warning:** User should be alerted that expenses exceed income

---

### Edge Case 2: No Occurrences in Current Cycle
**Setup:**
- Income: $1,000, 30 days (Dec 1-30)
- Recurring: $50, Monthly, starts Jan 15

**Expected Results:**
- Occurrences: 0 (starts after cycle ends)
- Total deduction: $0
- Available balance: $1,000
- Preview shows: "Monthly • No occurrences in current cycle"

---

### Edge Case 3: Recurring Expense Ended Before Cycle
**Setup:**
- Income: $1,000, 30 days (Jan 1-30)
- Recurring: $50, Monthly, starts Nov 1, ends Dec 31

**Expected Results:**
- Occurrences: 0 (already ended)
- Total deduction: $0
- Available balance: $1,000
- Expense not counted as active

---

### Edge Case 4: Adding Recurring Expense Mid-Cycle
**Setup:**
1. Start cycle with income $1,000, 30 days
2. Daily budget initially: $33.33/day
3. Day 10: Add recurring expense $90, Monthly, starts today

**Expected Results:**
- Occurrences: 1 (today)
- Total deduction: $90
- Budget recalculates immediately
- New daily budget: ($1,000 - $90) / 20 days remaining = $45.50/day
- applyRecurringExpenses() called automatically

---

### Edge Case 5: Removing Recurring Expense
**Setup:**
1. Income: $1,000, 30 days with $90 recurring expense
2. Daily budget: $30.33/day
3. Remove the recurring expense

**Expected Results:**
- Total deduction: $0
- Budget recalculates immediately
- New daily budget: $1,000 / 30 = $33.33/day
- applyRecurringExpenses() called automatically
- Console shows recalculation

---

### Edge Case 6: Month-End Date Handling
**Setup:**
- Recurring: $50, Monthly, starts Jan 31

**Expected Results:**
- Next occurrence: Feb 28 (or Feb 29 in leap year)
- March occurrence: March 31
- Correctly handles months with different days

---

## State Validation

After adding recurring expenses, check state has:

```javascript
{
  recurringExpenses: [
    {
      id: "timestamp",
      description: "Netflix",
      amount: 15,
      category: "entertainment",
      frequency: "monthly",
      startDate: "2025-01-01",
      endDate: null,
      isRecurring: true,
      timestamp: 1234567890
    }
  ],
  budget: {
    recurringExpenseDeduction: 15,
    dailyBudget: 32.83, // After deduction
    // ... other budget fields
  }
}
```

---

## Console Validation

When recurring expenses are applied, console should show:

```
Applied recurring expenses: {
  activeExpenses: 2,
  totalDeduction: "$45.00",
  availableBalance: "$955.00",
  newDailyBudget: "$31.83"
}
```

When adding a recurring expense:

```
Recurring expense added: {
  description: "Netflix",
  amount: "$15.00",
  frequency: "monthly"
}
```

---

## Formula Verification

The correct calculation order is:
1. **Start with income amount** (e.g., $1,000)
2. **Calculate recurring expense deduction** (e.g., $45)
3. **Subtract from balance** ($1,000 - $45 = $955)
4. **Subtract initial expenses fund** ($955 - $600 = $355)
5. **Divide by days remaining** ($355 / 30 = $11.83/day)

This ensures:
- Recurring expenses are deducted immediately
- Initial expenses are reserved but not deducted yet
- Daily budget reflects what's actually available to spend

---

## Integration Points Tested

✅ **setupIncome()** - Applies recurring expenses on initial setup
✅ **addRecurringExpense()** - Recalculates budget when expense added
✅ **removeRecurringExpense()** - Recalculates budget when expense removed
✅ **rolloverToNextCycle()** - Applies recurring expenses on payday
✅ **ExpenseForm UI** - Shows preview of occurrences and total

---

## UI Validation

### Expense Form Preview
When user checks "This is a recurring expense":
- Conditional fields appear with animation
- Frequency dropdown defaults to Monthly
- Start date defaults to today
- Preview updates in real-time
- Example: "Monthly • 2 occurrences this cycle = $30.00 total"

### Dashboard (Future - Part 3)
Should show:
- "Committed Funds" card
- Breakdown: Initial Expenses + Recurring Expenses
- Total: $900 ($800 initial + $100 recurring)

---

## Performance Considerations

- RecurringExpense.calculateOccurrences() has safety limit of 10,000 iterations
- For daily expenses over 27+ years, will stop at 10,000 occurrences
- Typical usage (monthly/weekly over 30 days) very fast

---

## Backward Compatibility

✅ Existing users without recurring expenses: Works normally
✅ State migration: Automatically adds empty recurringExpenses array
✅ One-time expenses: Unchanged, continue working as before
✅ Initial expenses: Still function correctly with recurring expenses

---

## Known Limitations (By Design)

1. **No automatic actual deduction**: Recurring expenses calculate what WILL be charged, but don't create actual expense records. User still marks when actually paid.

2. **Recalculates on every cycle**: If Netflix is $15/month and you have 3 monthly cycles, it counts 3 occurrences ($45 total), not 1.

3. **No proration**: If you add a monthly expense on day 15 of 30, it still counts as 1 full occurrence, not 0.5.

---

## Future Enhancements (Not in Scope)

- Auto-create actual expenses on occurrence dates
- Send reminders before recurring expenses are due
- Categorized breakdown of recurring expenses
- Edit existing recurring expenses
- Pause/resume recurring expenses
- Recurring expense templates
