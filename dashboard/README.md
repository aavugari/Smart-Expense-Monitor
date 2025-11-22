# Mobile Dashboard Setup

## Quick Setup Guide

### 1. Deploy Google Apps Script API
1. Open Google Apps Script (script.google.com)
2. Create new project
3. Copy code from `api.gs` into the script editor
4. Deploy as Web App:
   - Execute as: Me
   - Who has access: Anyone
5. Copy the Web App URL

### 2. Update Dashboard Configuration
1. Edit `index.html`
2. Replace `YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE` with your Web App URL

### 3. Host Dashboard
**Option A: GitHub Pages (Free)**
1. Push dashboard folder to GitHub
2. Enable GitHub Pages in repository settings
3. Access via: `https://yourusername.github.io/repository-name/dashboard/`

**Option B: Local Server**
```bash
cd dashboard
python -m http.server 8000
# Access via: http://localhost:8000
```

### 4. Install on Phone
1. Open dashboard URL in mobile browser
2. Tap "Add to Home Screen" (iOS) or "Install App" (Android)
3. App will appear on home screen

## Features
- 📱 **Mobile Optimized**: Responsive design for phones
- 🔄 **Real-time Data**: Connects to your Google Sheets
- 📊 **Daily/Monthly Summaries**: Quick spending overview
- 💳 **Bank Breakdown**: Spending by person and bank
- 📈 **Recent Transactions**: Latest 10 transactions
- ⚡ **PWA**: Install as native app
- 🔄 **Auto-refresh**: Updates every 5 minutes

## Customization
- Edit colors in CSS variables
- Modify refresh interval in JavaScript
- Add new data visualizations
- Customize transaction categories

## Troubleshooting
- **No data showing**: Check Web App URL and permissions
- **CORS errors**: Ensure Web App is deployed with "Anyone" access
- **Install not working**: Use HTTPS hosting (GitHub Pages recommended)