# Recurring Income Testing Guide

## Feature: Recurring Paychecks (Prompt 2.1)

This document outlines testing scenarios for the recurring income feature.

## Test Scenarios

### Scenario 1: Weekly Income Setup
**Steps:**
1. Open income setup wizard
2. Select "Recurring" income type
3. Select "Weekly (every 7 days)" frequency
4. Set next payday to 7 days from today
5. Complete setup

**Expected Results:**
- Income saved with frequency: 'weekly'
- Next payday: 7 days from today
- Days remaining: 7
- Future paydays preview shows correct dates (7, 14, 21 days out)

**Auto-Rollover Test:**
- Change system date to next payday
- Refresh app
- Balance should reset to income amount
- Next payday should advance by 7 days
- Days remaining should reset to 7

---

### Scenario 2: Bi-Weekly Income Setup
**Steps:**
1. Open income setup wizard
2. Select "Recurring" income type
3. Select "Bi-Weekly (every 14 days)" frequency
4. Set next payday to 14 days from today
5. Complete setup

**Expected Results:**
- Income saved with frequency: 'bi-weekly'
- Next payday: 14 days from today
- Days remaining: 14
- Future paydays preview shows correct dates (14, 28, 42 days out)

**Auto-Rollover Test:**
- Change system date to next payday
- Refresh app
- Balance should reset to income amount
- Next payday should advance by 14 days
- Days remaining should reset to 14

---

### Scenario 3: Semi-Monthly Income Setup
**Steps:**
1. Open income setup wizard
2. Select "Recurring" income type
3. Select "Semi-Monthly (twice a month)" frequency
4. Set next payday to 15 days from today
5. Complete setup

**Expected Results:**
- Income saved with frequency: 'semi-monthly'
- Next payday: 15 days from today
- Days remaining: 15
- Future paydays preview shows correct dates (15, 30, 45 days out)

**Auto-Rollover Test:**
- Change system date to next payday
- Refresh app
- Balance should reset to income amount
- Next payday should advance by 15 days
- Days remaining should reset to 15

---

### Scenario 4: Monthly Income Setup
**Steps:**
1. Open income setup wizard
2. Select "Recurring" income type
3. Select "Monthly" frequency
4. Set next payday to same date next month
5. Complete setup

**Expected Results:**
- Income saved with frequency: 'monthly'
- Next payday: same date next month
- Days remaining: ~30 days (varies by month)
- Future paydays preview shows correct dates (same day each month)

**Edge Case - Month End:**
- Set next payday to January 31st
- Future payday should show February 28th (or 29th in leap years)
- March payday should show March 31st

**Auto-Rollover Test:**
- Change system date to next payday
- Refresh app
- Balance should reset to income amount
- Next payday should advance by 1 month
- Days remaining should reset to days until next payday

---

### Scenario 5: One-Time Income (Backward Compatibility)
**Steps:**
1. Open income setup wizard
2. Select "One-Time" income type
3. Enter days to last (e.g., 14)
4. Complete setup

**Expected Results:**
- Income saved with frequency: 'one-time'
- No nextPayday field
- Days remaining: 14
- No auto-rollover occurs

---

### Scenario 6: Switching Between Income Types
**Steps:**
1. Start with One-Time selected
2. Switch to Recurring
3. Verify frequency and date fields appear
4. Switch back to One-Time
5. Verify days field appears

**Expected Results:**
- Fields toggle correctly
- Required validation updates appropriately
- No errors in console

---

### Scenario 7: Recurring Income with Initial Expenses
**Steps:**
1. Set up recurring bi-weekly income ($2000, 14 days)
2. Add initial expense: Rent ($800)
3. Add initial expense: Phone ($100)
4. Complete setup

**Expected Results:**
- Balance: $2000
- Initial expenses fund: $900
- Available balance: $1100
- Daily budget: $1100 / 14 = $78.57/day

**Auto-Rollover Test:**
- Mark rent as paid ($800 deducted from balance)
- Balance: $1200, Fund: $100
- Change date to payday
- Rollover occurs
- Balance resets to $2000
- Initial expenses fund stays at $100 (phone still unpaid)
- Available: $1900, Daily budget: $1900 / 14 = $135.71/day

---

### Scenario 8: Payday Check on App Load
**Steps:**
1. Set up recurring income with next payday today
2. Close browser
3. Reopen app

**Expected Results:**
- checkAndHandlePayday() runs on init()
- Rollover occurs automatically
- Console shows "💰 Payday rollover completed"
- Dashboard refreshes with new cycle

---

### Scenario 9: Payday Check with Page Visibility
**Steps:**
1. Set up recurring income
2. Change system date to payday
3. Switch to another tab
4. Switch back to budget tracker tab

**Expected Results:**
- Visibility change triggers checkDailyRollover()
- Rollover occurs
- Dashboard updates

---

### Scenario 10: Periodic Payday Check
**Steps:**
1. Set up recurring income with payday in 5 minutes
2. Leave app open
3. Wait 5 minutes

**Expected Results:**
- Automatic rollover check runs every 5 minutes
- When payday arrives, rollover occurs automatically
- Console logs rollover event

---

## Edge Cases to Test

### Edge Case 1: Invalid Date Selection
- Try to select a past date for next payday
- Should show error: "Next payday must be today or in the future"

### Edge Case 2: Today as Payday
- Set next payday to today
- Should calculate days as 1 (not 0)
- Rollover should occur on next app load

### Edge Case 3: Month Boundary - February
- Set monthly payday to January 31st
- Next payday should be February 28th (not March 3rd)
- Then March 31st for following month

### Edge Case 4: Month Boundary - 30-day Month
- Set monthly payday to March 31st
- Next payday should be April 30th
- Then May 31st

### Edge Case 5: Editing Existing Income
- Set up recurring income
- Edit income setup
- Fields should populate with existing values
- Frequency and date should show correctly

---

## Console Validation

When rollover occurs, console should show:
```
Payday detected! Rolling over to next cycle...
Rollover complete! {newBalance: "$2000.00", nextPayday: "January 15, 2025", daysUntilNext: 14}
💰 Payday rollover completed
```

## State Validation

After rollover, state should have:
- `income.frequency`: unchanged (weekly, bi-weekly, etc.)
- `income.nextPayday`: advanced by appropriate interval
- `income.daysToLast`: updated to new interval
- `budget.currentBalance`: reset to income amount
- `budget.startingBalance`: reset to income amount
- `budget.dailyBudget`: recalculated
- `budget.todaySpent`: reset to 0
- `budget.cycleStartDate`: today
- `budget.cycleEndDate`: today + daysUntilNext
- `budget.daysRemaining`: daysUntilNext
- `initialExpenses.fund`: unchanged (carries over)
- `expenses`: preserved (history maintained)

---

## Future Enhancements (Not in Scope)

- **Phase 2.2**: Recurring expenses applied automatically on rollover
- **Phase 3**: Archive cycle data to history before rollover
- **Notifications**: Alert user when payday occurs
- **Manual Rollover**: Button to manually trigger rollover early
