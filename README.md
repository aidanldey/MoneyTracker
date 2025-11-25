# Daily Budget Tracker 💰

A Progressive Web App for tracking daily expenses, managing budgets, and reaching savings goals.

[![Lighthouse Score](https://img.shields.io/badge/Lighthouse-90+-brightgreen)]()
[![PWA](https://img.shields.io/badge/PWA-enabled-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

## Features

### 💸 Budget Management
- Set income and pay period duration
- Automatic daily budget calculation
- Track remaining funds in real-time
- Visual status indicators

### 📊 Expense Tracking
- Quick expense entry
- 8 predefined categories (+ custom names)
- One-time and recurring expenses
- Today's expenses at a glance

### 🎯 Savings Fund
- Dedicated savings tracker
- Add/withdraw funds
- Savings history
- Goal tracking

### 📅 Initial Expenses (Committed Funds)
- Track bills and obligations
- Mark as paid
- Automatic budget adjustment
- Due date tracking

### 📈 Expense History
- 4-level progressive disclosure:
  - Summary view
  - Weekly/daily breakdown
  - Category breakdown with percentages
  - Full searchable list
- Search, filter, and sort
- Export to CSV

### 🔄 Pay Period Transitions
- Archive previous periods
- 3 transition options:
  - Archive and start fresh
  - Clear and start fresh
  - Continue with current data
- Archive viewer with details
- Export archives to CSV

### 💾 Data Management
- Export backup as JSON
- Import from backup
- Preview before applying
- Merge or replace options
- Clear all data

### 📱 Progressive Web App
- Install to home screen
- Offline functionality
- App shortcuts
- Native-like experience
- Service worker caching

### ✨ Animations & UX
- Smooth modal transitions
- Button press feedback
- Card hover effects
- Toast notifications
- Number count-up animations
- Confetti celebrations
- Skeleton loading states
- Reduced motion support

## Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- HTTPS (required for PWA features)

### Installation

1. **Clone repository:**
   ```bash
   git clone https://github.com/your-username/daily-budget-tracker.git
   cd daily-budget-tracker
   ```

2. **Serve locally:**
   ```bash
   # Option 1: Python
   python3 -m http.server 8080

   # Option 2: Node.js
   npx http-server -p 8080

   # Option 3: PHP
   php -S localhost:8080
   ```

3. **Open browser:**
   ```
   http://localhost:8080
   ```

### First Use

1. **Set Income:**
   - Click "Manage Income"
   - Enter income amount
   - Set pay period duration (days)
   - Daily budget calculated automatically

2. **Add Expenses:**
   - Click "Add Expense"
   - Enter amount and description
   - Optionally categorize
   - View remaining balance update

3. **End of Day:**
   - Click "End of Day" when day ends
   - Choose how to handle leftover/overspent funds
   - Options: save, redistribute, or adjust budget

## Technology Stack

- **Vanilla JavaScript** - No frameworks, pure ES6+ modules
- **CSS3** - Custom properties, animations, responsive design
- **Service Worker** - Offline support, caching strategies
- **LocalStorage** - Client-side data persistence
- **Progressive Web App** - Installable, offline-first

## Architecture

### File Structure

```
MoneyTracker/
├── index.html              # Main HTML
├── 404.html                # Custom error page
├── manifest.json           # PWA manifest
├── service-worker.js       # Service worker for offline support
│
├── styles/
│   ├── variables.css       # CSS custom properties
│   ├── base.css            # Base styles
│   └── components.css      # Component styles with animations
│
├── js/
│   ├── app.js              # Main application entry point
│   │
│   ├── state/
│   │   └── BudgetStore.js  # Centralized state management
│   │
│   ├── models/
│   │   ├── BudgetCalculator.js  # Budget calculations
│   │   └── Expense.js           # Expense model
│   │
│   ├── features/
│   │   ├── Dashboard.js         # Main dashboard
│   │   ├── IncomeSetup.js       # Income management
│   │   ├── ExpenseForm.js       # Expense entry
│   │   ├── ExpenseHistory.js    # History with 4 levels
│   │   ├── PayPeriodManager.js  # Period transitions
│   │   ├── DataManager.js       # Backup/restore
│   │   ├── EndOfDay.js          # EOD reconciliation
│   │   ├── SavingsFund.js       # Savings management
│   │   ├── InitialExpensesForm.js
│   │   └── InitialExpensesList.js
│   │
│   └── utils/
│       ├── animations.js    # Animation utilities
│       ├── dateUtils.js     # Date helpers
│       ├── formatters.js    # Formatting helpers
│       ├── validation.js    # Input validation
│       └── moneyUtils.js    # Money operations
│
├── icons/                   # PWA icons (all sizes)
├── scripts/                 # Build scripts
├── docs/                    # Documentation
│   ├── ANIMATIONS.md        # Animation guide
│   ├── TESTING.md           # Testing guide
│   └── DEPLOYMENT.md        # Deployment guide
│
├── netlify.toml             # Netlify config
└── vercel.json              # Vercel config
```

### State Management

**BudgetStore** - Singleton pattern for centralized state:
- Income settings
- Expenses array
- Budget calculations
- Savings fund
- Initial expenses
- Archives
- UI state

**Event-driven updates:**
```javascript
store.subscribe((state) => {
  // React to state changes
  dashboard.render();
});
```

### Data Flow

```
User Action → Feature Module → BudgetStore.setState()
    ↓
BudgetStore.save() → localStorage
    ↓
Store.notify() → Subscribers → UI Update
```

## Documentation

- [**ANIMATIONS.md**](./docs/ANIMATIONS.md) - Animation system guide
- [**TESTING.md**](./docs/TESTING.md) - Comprehensive testing guide
- [**DEPLOYMENT.md**](./docs/DEPLOYMENT.md) - Deployment and hosting guide

## Development

### Coding Standards

- **ES6+ Modules** - Use import/export
- **Singleton Pattern** - For features and utilities
- **Event-Driven** - Custom events for inter-component communication
- **No Frameworks** - Vanilla JavaScript only
- **Semantic HTML** - Accessible markup
- **CSS Custom Properties** - Design tokens
- **Mobile-First** - Responsive design

### Adding a Feature

1. **Create module:**
   ```javascript
   // js/features/MyFeature.js
   class MyFeature {
     constructor() {
       // Initialize
     }

     init() {
       // Setup
     }
   }

   export default new MyFeature();
   ```

2. **Import in app.js:**
   ```javascript
   import myFeature from './features/MyFeature.js';
   myFeature.init();
   ```

3. **Subscribe to state:**
   ```javascript
   store.subscribe((state) => {
     this.render(state);
   });
   ```

### Animation Usage

```javascript
import { toast, animateNumber, showCelebration } from './js/utils/animations.js';

// Success message
toast.show('Expense added!', { type: 'success' });

// Animate number change
animateNumber(element, 1234.56, 800);

// Celebrate achievement
showCelebration({
  title: 'Goal Reached!',
  message: 'You saved $1000!'
});
```

## Testing

### Run Tests

```bash
# Manual testing checklist
See docs/TESTING.md

# Lighthouse audit
lighthouse http://localhost:8080 --view

# Cross-browser testing
# Test in Chrome, Firefox, Safari, Edge
```

### Test Coverage

- ✅ Core functionality
- ✅ Cross-browser compatibility
- ✅ Mobile devices
- ✅ Accessibility (WCAG AA)
- ✅ Performance (90+ Lighthouse)
- ✅ Offline functionality

## Deployment

### Quick Deploy

**Netlify (Recommended):**
```bash
# Push to GitHub
git push

# Deploy via Netlify UI
# Or use Netlify CLI:
netlify deploy --prod
```

**Vercel:**
```bash
vercel --prod
```

**GitHub Pages:**
```bash
# Enable in repository settings
# Deploys automatically on push
```

See [**DEPLOYMENT.md**](./docs/DEPLOYMENT.md) for detailed instructions.

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 80+ | ✅ Full |
| Firefox | 75+ | ✅ Full |
| Safari | 13+ | ✅ Full |
| Edge | 80+ | ✅ Full |
| Samsung Internet | 12+ | ✅ Full |
| iOS Safari | 13+ | ✅ Full |
| Chrome Android | 80+ | ✅ Full |

## Accessibility

- ✅ WCAG 2.1 Level AA compliant
- ✅ Keyboard navigation
- ✅ Screen reader compatible
- ✅ Color contrast verified
- ✅ Touch targets ≥ 44px
- ✅ Reduced motion support

## Privacy

- **No tracking** - No analytics cookies
- **Local storage** - All data stays on device
- **No accounts** - No sign-up required
- **No cloud sync** - No data sent to servers
- **Export anytime** - Full data control

## Performance

- **Lighthouse Score:** 90+ (all categories)
- **First Paint:** < 1s
- **Time to Interactive:** < 3s
- **Bundle Size:** < 100KB (minified)
- **Offline:** Full functionality

## License

MIT License - See [LICENSE](./LICENSE) for details.

## Contributing

Contributions welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines

- Follow existing code style
- Write descriptive commit messages
- Test thoroughly
- Update documentation
- Ensure accessibility
- Maintain performance

## Roadmap

### Planned Features

- [ ] Dark mode
- [ ] Multiple currencies
- [ ] Budget templates
- [ ] Spending insights
- [ ] Charts and graphs
- [ ] Export to PDF
- [ ] Recurring expense automation
- [ ] Budget sharing (optional cloud sync)
- [ ] Multi-language support
- [ ] Custom themes

## FAQ

**Q: Does this app sync across devices?**
A: No, all data is stored locally on your device. Use the backup/restore feature to transfer data.

**Q: Is my data secure?**
A: Yes, all data stays on your device using browser localStorage. No data is sent to any server.

**Q: Can I use this offline?**
A: Yes, after the first visit, the app works completely offline thanks to the service worker.

**Q: How do I backup my data?**
A: Go to "Manage Data" → "Backup Data" to export a JSON file. Import it anytime to restore.

**Q: What browsers are supported?**
A: Modern browsers (Chrome, Firefox, Safari, Edge) from the last 2 years.

**Q: Can I install this as an app?**
A: Yes! Click "Install" when prompted, or use "Add to Home Screen" on mobile.

## Support

- **Issues:** [GitHub Issues](https://github.com/your-username/daily-budget-tracker/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-username/daily-budget-tracker/discussions)
- **Email:** support@yourdomain.com

## Acknowledgments

- Built with vanilla JavaScript (no frameworks needed!)
- Icons generated using custom SVG generator
- Inspired by the need for simple, privacy-focused budgeting
- Thanks to the PWA community for excellent resources

## Links

- **Demo:** https://budgettracker.yourdomain.com
- **Documentation:** [docs/](./docs/)
- **GitHub:** https://github.com/your-username/daily-budget-tracker
- **Play Store:** (coming soon)

---

Made with ❤️ for better personal finance management
