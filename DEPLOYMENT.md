# Deployment Guide for Cipher Suite

## Quick Start

### Local Development
```bash
cd amerkovacevic/encryption
npm install
npm run dev
```

The app will open at `http://localhost:5173`

## Firebase Deployment

### First Time Setup
1. Install Firebase CLI (if not already installed):
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase (if needed):
```bash
firebase init hosting
```
- Select your Firebase project
- Set public directory to: `dist`
- Configure as single-page app: `Yes`
- Don't overwrite existing files

### Deploy
```bash
# Build the production version
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

## Build Verification

Before deploying, always build and preview:
```bash
npm run build
npm run preview
```

This will:
1. Create an optimized production build in the `dist` folder
2. Preview the production build locally at `http://localhost:4173`

## Troubleshooting

### Build Errors
If you encounter build errors:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Try building again with `npm run build`

### Firebase Deployment Issues
If deployment fails:
1. Check you're logged in: `firebase login`
2. Check you're in the correct project: `firebase projects:list`
3. Verify `firebase.json` points to the `dist` folder

## Environment

- Node.js: v18 or higher recommended
- npm: v9 or higher recommended

## Performance

Production build includes:
- Minified JavaScript
- Optimized CSS with PurgeCSS
- Asset optimization
- Gzip compression

Typical build size: ~75 KB gzipped

