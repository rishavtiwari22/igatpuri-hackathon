# 🚨 FIREBASE FIRESTORE SETUP REQUIRED

## The 400 errors indicate that Firestore is not properly set up for your project.

### ✅ **IMMEDIATE ACTION REQUIRED:**

1. **Go to Firebase Console**: https://console.firebase.google.com/project/img-prompt-project

2. **Enable Firestore Database**:
   - In the left sidebar, click **"Firestore Database"**
   - Click **"Create database"**
   - Choose **"Start in test mode"** (for development)
   - Select a location (choose closest to your users)
   - Click **"Create"**

3. **Set Security Rules** (Temporary - for testing):
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow read/write access to authenticated users
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

4. **Enable Realtime Database** (if not done):
   - In the left sidebar, click **"Realtime Database"**
   - Click **"Create Database"**
   - Choose **"Start in test mode"**
   - Select same location as Firestore

### 🔍 **Check Project Settings**:
- Verify your project ID is: `img-prompt-project`
- Ensure Web app is properly configured
- Check that all API keys are correctly copied

### 🛠️ **After Setup**:
1. Refresh your application
2. Try logging in and using features
3. Monitor console for any remaining errors

### 📞 **If Issues Persist**:
- Check Firebase Console → Usage tab
- Verify billing account (if needed)
- Check project permissions/ownership
