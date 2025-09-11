# Firebase Troubleshooting Guide

## Current Issues

1. **Firestore Connection Errors**: Getting 400 errors when trying to connect to Firestore
2. **WebChannelConnection RPC Errors**: Transport errors on Write/Read operations

## Quick Fixes to Try

### 1. Enable Firestore Database
1. Go to [Firebase Console](https://console.firebase.google.com/project/img-prompt-project)
2. Click on "Firestore Database" in the left sidebar
3. If not created, click "Create database"
4. Choose "Start in test mode" for development
5. Select a location close to you

### 2. Check Security Rules
Your Firestore security rules should allow authenticated users to read/write their own data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow anyone to read/write in test mode (temporary)
    match /{document=**} {
      allow read, write: if true; // REMOVE THIS IN PRODUCTION
    }
  }
}
```

### 3. Check Authentication
1. Go to Firebase Console → Authentication
2. Click "Sign-in method" tab
3. Make sure Google is enabled
4. Add your domain to authorized domains if needed

### 4. Network Issues
If you're behind a corporate firewall or using a VPN, try:
1. Disable VPN temporarily
2. Try a different network
3. Check if firestore.googleapis.com is accessible

## Demo Mode Alternative

If Firebase continues to have issues, you can use the app in Demo Mode:
1. Click "Try Demo" on the login screen
2. All features work with localStorage only
3. Progress won't sync across devices

## Current Status

✅ Firebase SDK configured correctly
✅ API keys loaded properly
✅ Authentication working
❌ Firestore connection issues
✅ Offline fallback implemented
