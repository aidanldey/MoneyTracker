# Deployment Guide - Daily Budget Tracker

Complete guide for deploying the Daily Budget Tracker to various platforms.

## Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Web Hosting](#web-hosting)
  - [Netlify](#netlify)
  - [Vercel](#vercel)
  - [GitHub Pages](#github-pages)
  - [Firebase Hosting](#firebase-hosting)
- [Play Store (Android)](#play-store-android)
- [Analytics Setup](#analytics-setup)
- [Error Logging](#error-logging)
- [Post-Launch](#post-launch)
- [Maintenance](#maintenance)

---

## Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All tests pass (see [TESTING.md](./TESTING.md))
- [ ] Lighthouse score > 90 for all categories
- [ ] Cross-browser testing complete
- [ ] Mobile testing complete
- [ ] Accessibility audit passed
- [ ] Security headers configured
- [ ] Privacy policy drafted
- [ ] Terms of service drafted
- [ ] 404 page created
- [ ] Service worker tested
- [ ] PWA manifest validated
- [ ] Icons generated (all sizes)
- [ ] Meta tags optimized
- [ ] Performance optimized
- [ ] Code reviewed
- [ ] Documentation complete

---

## Web Hosting

### Netlify

**Recommended for:** Easiest deployment with great PWA support

#### Setup

1. **Sign up** at [netlify.com](https://netlify.com)

2. **Connect Repository:**
   ```bash
   # Push code to GitHub
   git remote add origin https://github.com/your-username/daily-budget-tracker.git
   git push -u origin main
   ```

3. **Import Project:**
   - Click "Add new site" > "Import an existing project"
   - Connect to GitHub
   - Select repository
   - Configure build settings:
     - Build command: (leave empty)
     - Publish directory: `.`
   - Click "Deploy site"

4. **Configuration:**
   - The `netlify.toml` file in the root handles configuration
   - Includes security headers, caching, and redirects

5. **Custom Domain (Optional):**
   - Go to Domain settings
   - Add custom domain
   - Configure DNS:
     ```
     A record: @ → 75.2.60.5
     CNAME record: www → your-site.netlify.app
     ```

6. **HTTPS:**
   - Automatically provisioned via Let's Encrypt
   - Force HTTPS redirect enabled by default

#### Environment Variables

```bash
# Netlify UI: Site settings > Environment variables
# None required for basic deployment
```

#### Continuous Deployment

Automatic deploys on:
- Push to `main` branch
- Pull request previews
- Branch deploys

---

### Vercel

**Recommended for:** High performance edge network

#### Setup

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   cd /path/to/MoneyTracker
   vercel
   ```

3. **Follow prompts:**
   - Link to existing project or create new
   - Confirm settings
   - Deploy

4. **Production Deployment:**
   ```bash
   vercel --prod
   ```

5. **Configuration:**
   - The `vercel.json` file handles configuration
   - Includes routing, headers, and caching

6. **Custom Domain:**
   ```bash
   vercel domains add yourdomain.com
   ```

#### Git Integration

Connect to GitHub:
- Go to [vercel.com](https://vercel.com)
- Import project from GitHub
- Auto-deploys on push

---

### GitHub Pages

**Recommended for:** Free hosting for public repositories

#### Setup

1. **Enable GitHub Pages:**
   - Go to repository Settings > Pages
   - Source: Deploy from a branch
   - Branch: `main`, folder: `/` (root)
   - Save

2. **Custom Domain (Optional):**
   - Add `CNAME` file to root:
     ```bash
     echo "budgettracker.yourdomain.com" > CNAME
     git add CNAME
     git commit -m "Add custom domain"
     git push
     ```

3. **Configure DNS:**
   ```
   A records:
   @ → 185.199.108.153
   @ → 185.199.109.153
   @ → 185.199.110.153
   @ → 185.199.111.153

   CNAME:
   www → your-username.github.io
   ```

4. **HTTPS:**
   - Enforce HTTPS in repository settings
   - Certificate auto-provisioned

#### Limitations

- No custom headers
- No server-side redirects
- Public repositories only (free tier)

#### Workaround for Headers

Use `_headers` file (Netlify-style) with a build process, or inject headers via service worker.

---

### Firebase Hosting

**Recommended for:** Google Cloud integration

#### Setup

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login:**
   ```bash
   firebase login
   ```

3. **Initialize:**
   ```bash
   firebase init hosting
   ```

4. **Configure (`firebase.json`):**
   ```json
   {
     "hosting": {
       "public": ".",
       "ignore": [
         "firebase.json",
         "**/.*",
         "**/node_modules/**"
       ],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ],
       "headers": [
         {
           "source": "**/*.@(js|css|svg|png|jpg|jpeg|webp)",
           "headers": [
             {
               "key": "Cache-Control",
               "value": "public, max-age=31536000, immutable"
             }
           ]
         },
         {
           "source": "service-worker.js",
           "headers": [
             {
               "key": "Cache-Control",
               "value": "public, max-age=0, must-revalidate"
             }
           ]
         }
       ]
     }
   }
   ```

5. **Deploy:**
   ```bash
   firebase deploy
   ```

6. **Custom Domain:**
   ```bash
   firebase hosting:channel:deploy production --domain yourdomain.com
   ```

---

## Play Store (Android)

Deploy as Trusted Web Activity (TWA) for native Android app.

### Option 1: Bubblewrap (Recommended)

#### Setup

1. **Install Bubblewrap:**
   ```bash
   npm install -g @bubblewrap/cli
   ```

2. **Initialize:**
   ```bash
   bubblewrap init --manifest https://yourdomain.com/manifest.json
   ```

3. **Configure (`twa-manifest.json`):**
   ```json
   {
     "packageId": "com.yourname.budgettracker",
     "host": "yourdomain.com",
     "name": "Daily Budget Tracker",
     "launcherName": "Budget Tracker",
     "display": "standalone",
     "themeColor": "#2563eb",
     "backgroundColor": "#ffffff",
     "startUrl": "/",
     "iconUrl": "https://yourdomain.com/icons/icon-512x512.png",
     "maskableIconUrl": "https://yourdomain.com/icons/icon-512x512-maskable.png",
     "splashScreenFadeOutDuration": 300,
     "enableNotifications": false,
     "signing": {
       "keystore": "./android.keystore",
       "alias": "budgettracker"
     }
   }
   ```

4. **Build:**
   ```bash
   bubblewrap build
   ```

5. **Generate Keystore:**
   ```bash
   keytool -genkey -v -keystore android.keystore -alias budgettracker \
     -keyalg RSA -keysize 2048 -validity 10000
   ```

6. **Digital Asset Links:**
   Create `.well-known/assetlinks.json` on your web server:
   ```json
   [
     {
       "relation": ["delegate_permission/common.handle_all_urls"],
       "target": {
         "namespace": "android_app",
         "package_name": "com.yourname.budgettracker",
         "sha256_cert_fingerprints": [
           "YOUR_CERTIFICATE_FINGERPRINT"
         ]
       }
     }
   ]
   ```

   Get fingerprint:
   ```bash
   keytool -list -v -keystore android.keystore
   ```

7. **Test APK:**
   ```bash
   bubblewrap install
   ```

### Option 2: PWA Builder

#### Setup

1. **Visit:** [pwabuilder.com](https://www.pwabuilder.com/)

2. **Enter URL:** https://yourdomain.com

3. **Build Package:**
   - Click "Package for stores"
   - Select Android
   - Configure options
   - Download package

4. **Extract & Build:**
   ```bash
   unzip budgettracker-android.zip
   cd budgettracker-android
   ./gradlew assembleRelease
   ```

### Play Store Submission

1. **Create Developer Account:**
   - Go to [play.google.com/console](https://play.google.com/console)
   - Pay $25 one-time fee
   - Complete account setup

2. **Create App:**
   - Click "Create app"
   - Fill in details:
     - Name: Daily Budget Tracker
     - Default language: English
     - App/Game: App
     - Free/Paid: Free
   - Accept declarations

3. **Store Listing:**

   **App Details:**
   - App name: Daily Budget Tracker
   - Short description (80 chars):
     ```
     Track daily expenses, manage budgets, and reach your savings goals effortlessly.
     ```
   - Full description (4000 chars):
     ```
     Daily Budget Tracker helps you take control of your finances with:

     ✨ FEATURES
     • Simple expense tracking
     • Daily budget management
     • Savings goal tracker
     • Category-based spending
     • Expense history with filters
     • Data backup & restore
     • Offline functionality
     • Privacy-focused (no account required)

     💰 BUDGET MANAGEMENT
     Set your income and pay period duration. The app automatically calculates
     your daily budget and tracks remaining funds.

     📊 EXPENSE TRACKING
     Quickly add expenses with optional categories. View spending patterns
     with detailed breakdowns by category and time period.

     💾 DATA CONTROL
     All data stored locally on your device. Export backups anytime.
     No ads, no tracking, no cloud sync.

     🎯 SAVINGS GOALS
     Set aside money for savings and watch your fund grow. Track progress
     and celebrate milestones.

     📱 PROGRESSIVE WEB APP
     Works offline after first visit. Install to home screen for quick access.

     Perfect for students, freelancers, families, or anyone managing a budget!
     ```

   **Graphics:**
   - App icon: 512x512px (use generated icon)
   - Feature graphic: 1024x500px
   - Screenshots (minimum 2):
     - Phone: 320-3840px (width), 1:2 ratio
     - 7" tablet: 1024-3840px (width), 1:2 ratio
     - 10" tablet: 1024-3840px (width), 1:2 ratio

4. **Categorization:**
   - App category: Finance
   - Tags: budget, expense tracker, savings, finance

5. **Contact Details:**
   - Email: your@email.com
   - Website: https://yourdomain.com
   - Privacy policy: https://yourdomain.com/privacy

6. **Upload App:**
   - Go to "Release" > "Production"
   - Create release
   - Upload APK/AAB
   - Release name: "1.0.0"
   - Release notes:
     ```
     Initial release of Daily Budget Tracker

     • Track daily expenses
     • Manage budgets
     • Save money
     • View expense history
     • Backup & restore data
     • Works offline
     ```

7. **Content Rating:**
   - Complete questionnaire
   - Select "Everyone" rating

8. **Pricing & Distribution:**
   - Free
   - Select countries (or worldwide)

9. **Submit for Review:**
   - Complete all required sections
   - Click "Submit app for review"
   - Wait 1-7 days for approval

---

## Analytics Setup

Privacy-friendly analytics (no cookies, GDPR-compliant).

### Plausible Analytics (Recommended)

**Why Plausible:**
- No cookies
- GDPR-compliant
- Lightweight (< 1KB)
- Privacy-focused
- No PII collected

#### Setup

1. **Sign up:** [plausible.io](https://plausible.io/)

2. **Add Site:**
   - Domain: yourdomain.com

3. **Add Script to `index.html`:**
   ```html
   <!-- Add before </head> -->
   <script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
   ```

4. **Custom Events (Optional):**
   ```javascript
   // Track expense added
   plausible('Expense Added', { props: { category: 'food', amount: 25 } });

   // Track savings goal reached
   plausible('Goal Reached', { props: { amount: 1000 } });

   // Track PWA install
   plausible('PWA Installed');
   ```

5. **Privacy Policy Update:**
   Add to privacy policy:
   ```
   We use Plausible Analytics to understand how visitors use our app.
   Plausible does not use cookies and does not collect personal data.
   All data is aggregated and anonymous. Learn more: plausible.io/privacy
   ```

### Umami Analytics (Self-Hosted)

**Why Umami:**
- Open source
- Self-hosted (full control)
- No cookies
- GDPR-compliant

#### Setup

1. **Deploy Umami:**
   ```bash
   # Using Docker
   docker run -d \
     -p 3000:3000 \
     -e DATABASE_URL=postgresql://user:pass@localhost:5432/umami \
     ghcr.io/umami-software/umami:postgresql-latest
   ```

2. **Add Script:**
   ```html
   <script async defer data-website-id="your-site-id"
     src="https://analytics.yourdomain.com/script.js"></script>
   ```

---

## Error Logging

Track errors and exceptions for debugging.

### Sentry (Recommended)

#### Setup

1. **Sign up:** [sentry.io](https://sentry.io/)

2. **Create Project:**
   - Platform: JavaScript
   - Name: Daily Budget Tracker

3. **Install SDK:**
   ```bash
   npm install --save @sentry/browser
   ```

4. **Initialize (in `js/app.js`):**
   ```javascript
   import * as Sentry from "@sentry/browser";

   Sentry.init({
     dsn: "your-dsn-here",
     environment: "production",
     release: "daily-budget-tracker@1.0.0",
     tracesSampleRate: 0.1, // Sample 10% of transactions
     ignoreErrors: [
       // Ignore common browser errors
       "ResizeObserver loop limit exceeded",
       "Non-Error promise rejection captured"
     ],
     beforeSend(event, hint) {
       // Filter out PII
       if (event.request) {
         delete event.request.cookies;
       }
       return event;
     }
   });
   ```

5. **Capture Errors:**
   ```javascript
   try {
     // Risky operation
   } catch (error) {
     Sentry.captureException(error);
   }
   ```

### Alternative: LogRocket

Records user sessions for debugging (more invasive):
```javascript
import LogRocket from 'logrocket';
LogRocket.init('app-id');
```

**Privacy Note:** LogRocket records sessions. Update privacy policy accordingly.

---

## Post-Launch

### Monitoring

1. **Uptime Monitoring:**
   - [UptimeRobot](https://uptimerobot.com/) (free)
   - [Pingdom](https://www.pingdom.com/)
   - Check every 5 minutes

2. **Performance Monitoring:**
   - [Web Vitals](https://web.dev/vitals/)
   - Real User Monitoring (RUM)
   - Lighthouse CI in pipeline

3. **Error Tracking:**
   - Sentry dashboard
   - Weekly error reports
   - Critical error alerts

### User Feedback

1. **In-App Feedback:**
   ```html
   <!-- Add to index.html -->
   <button id="feedback-btn">Feedback</button>

   <script>
     document.getElementById('feedback-btn').addEventListener('click', () => {
       window.location.href = 'mailto:support@yourdomain.com?subject=Budget Tracker Feedback';
     });
   </script>
   ```

2. **Survey (Optional):**
   - Use [Typeform](https://www.typeform.com/)
   - Survey after 1 week of use
   - NPS score

3. **App Store Reviews:**
   - Monitor Play Store reviews
   - Respond to feedback
   - Address issues in updates

### Marketing

1. **Launch Announcement:**
   - Blog post
   - Social media
   - Product Hunt
   - Hacker News

2. **SEO:**
   - Submit sitemap
   - Google Search Console
   - Bing Webmaster Tools

3. **Community:**
   - Reddit r/personalfinance
   - Finance forums
   - Budget communities

---

## Maintenance

### Regular Tasks

**Weekly:**
- [ ] Check error logs
- [ ] Review analytics
- [ ] Monitor uptime
- [ ] Check user feedback

**Monthly:**
- [ ] Run Lighthouse audits
- [ ] Update dependencies
- [ ] Review storage usage
- [ ] Backup user data (if server-side)

**Quarterly:**
- [ ] Major updates
- [ ] Feature additions
- [ ] Performance optimization
- [ ] Security audit

### Updates

1. **Version Numbering:**
   - Major: Breaking changes (1.0.0 → 2.0.0)
   - Minor: New features (1.0.0 → 1.1.0)
   - Patch: Bug fixes (1.0.0 → 1.0.1)

2. **Update Process:**
   ```bash
   # Update version in manifest.json
   # Update service worker cache name
   # Test thoroughly
   git tag v1.1.0
   git push --tags
   ```

3. **Changelog:**
   Maintain `CHANGELOG.md`:
   ```markdown
   # Changelog

   ## [1.1.0] - 2025-02-15
   ### Added
   - New expense categories
   - Dark mode support

   ### Fixed
   - Savings calculation bug
   - iOS scroll issue

   ## [1.0.0] - 2025-01-15
   - Initial release
   ```

### Backup Strategy

1. **Code Backup:**
   - GitHub repository
   - Multiple branches
   - Regular pushes

2. **User Data:**
   - Stored client-side (localStorage)
   - Users can export backups
   - No server-side storage

3. **Hosting Backup:**
   - Netlify/Vercel automatic backups
   - Git history as backup

---

## Troubleshooting

### Common Issues

**Service Worker Not Updating:**
```javascript
// Force update in console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.update());
});
```

**PWA Not Installable:**
- Check manifest.json validity
- Ensure HTTPS enabled
- Verify service worker registered
- Check Lighthouse PWA audit

**Caching Issues:**
- Update cache version in service-worker.js
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)

**Performance Issues:**
- Check Lighthouse report
- Optimize images
- Minimize JavaScript
- Enable compression

---

## Checklist: Pre-Launch

- [ ] Domain purchased
- [ ] Hosting configured
- [ ] HTTPS enabled
- [ ] DNS configured
- [ ] Custom domain working
- [ ] Service worker registered
- [ ] PWA installable
- [ ] Analytics installed
- [ ] Error logging configured
- [ ] 404 page working
- [ ] Security headers set
- [ ] Caching configured
- [ ] Lighthouse score > 90
- [ ] Cross-browser tested
- [ ] Mobile tested
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] User feedback mechanism ready

## Checklist: Play Store Launch

- [ ] TWA built and signed
- [ ] Developer account created
- [ ] App listing complete
- [ ] Screenshots uploaded
- [ ] Feature graphic created
- [ ] Privacy policy linked
- [ ] Content rating acquired
- [ ] Digital Asset Links configured
- [ ] APK tested
- [ ] Submission sent
- [ ] Approval received
- [ ] App published

---

## Resources

**Documentation:**
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [TWA Quick Start](https://developer.chrome.com/docs/android/trusted-web-activity/)
- [Play Store Guidelines](https://play.google.com/console/about/guides/)

**Tools:**
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [PWA Builder](https://www.pwabuilder.com/)
- [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap)
- [Asset Generator](https://www.pwabuilder.com/imageGenerator)

**Communities:**
- [PWA Slack](https://aka.ms/pwa-slack)
- [r/webdev](https://reddit.com/r/webdev)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/pwa)
