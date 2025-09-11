# 🔥 Firebase Setup Guide for AI Art Challenge

## 🎯 Quick Start Options

### **Option 1: Demo Mode (No Setup Required)**
- Click "Try Demo" on the login screen
- Full functionality with localStorage
- Progress saved locally only
- Perfect for testing and development

### **Option 2: Full Firebase Setup (Recommended for Production)**
Follow the steps below to set up your own Firebase project.

---

## 📋 Firebase Project Setup

### **Step 1: Create Firebase Project**

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Click "Create a project"**
3. **Enter project name**: `ai-art-challenge` (or your preferred name)
4. **Enable Google Analytics** (optional but recommended)
5. **Click "Create project"**

### **Step 2: Configure Authentication**

1. **Navigate to Authentication** in the left sidebar
2. **Click "Get started"**
3. **Go to "Sign-in method" tab**
4. **Enable Google Provider**:
   - Click on "Google"
   - Toggle the "Enable" switch
   - Enter your project's public-facing name
   - Select a support email address
   - Click "Save"

### **Step 3: Set up Firestore Database**

1. **Navigate to "Firestore Database"** in the left sidebar
2. **Click "Create database"**
3. **Choose "Start in test mode"** (for development)
4. **Select a location** (choose closest to your users)
5. **Click "Done"**

### **Step 4: Configure Web App**

1. **Go to Project Settings** (gear icon in left sidebar)
2. **Scroll down to "Your apps" section**
3. **Click the web icon** `</>`
4. **Register your app**:
   - App nickname: `AI Art Challenge Web`
   - **Don't check** "Also set up Firebase Hosting"
   - Click "Register app"
5. **Copy the configuration object**

You'll see something like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-XXXXXXXXXX"
};
```

### **Step 5: Update Environment Variables**

Replace the values in your `.env` file:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### **Step 6: Configure Firestore Security Rules (Optional)**

For production, update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🚀 Start the Application

1. **Restart the development server**:
   ```bash
   npm run dev
   ```

2. **Test the authentication**:
   - Visit the app in your browser
   - Try both Google login and Demo mode
   - Verify progress sync works

---

## ✨ Features

### **Authentication**
- ✅ Google Sign-in with Firebase Auth
- ✅ Guest/Demo mode for testing
- ✅ Secure session management
- ✅ Auto-logout handling

### **Data Storage**
- ✅ Real-time Firestore integration
- ✅ Automatic localStorage backup
- ✅ Cross-device progress sync
- ✅ Data migration from localStorage

### **User Experience**
- ✅ Beautiful login UI with animations
- ✅ Progress tracking and statistics
- ✅ Sync status indicators
- ✅ User profile management
- ✅ Offline functionality

---

## 🔧 Troubleshooting

### **Firebase Configuration Issues**
- Ensure all environment variables are correctly set
- Check that your Firebase project has the correct configuration
- Verify that Google authentication is enabled

### **Authentication Errors**
- Make sure your domain is authorized in Firebase Console
- Check browser console for detailed error messages
- Try clearing browser cache and cookies

### **Demo Mode Issues**
- Demo mode uses localStorage only
- Progress won't sync across devices in demo mode
- All features work except cloud sync

---

## 📊 Architecture

### **Authentication Flow**
```
User Login → AuthContext → Firebase Auth → User State Update
     ↓
Progressive Enhancement → Firebase Sync → Real-time Updates
```

### **Data Flow**
```
User Action → useFirebaseProgress Hook → Firebase Service → Firestore
     ↓                                          ↓
Local State Update ← ← ← ← ← ← ← ← ← ← ← ← ← Success
```

### **Guest Mode Flow**
```
Guest Login → Local Storage Only → No Cloud Sync
     ↓
All Features Available → Progress Saved Locally
```

---

## 🛡️ Security

- All Firebase security rules follow principle of least privilege
- Users can only access their own data
- Authentication tokens are managed automatically
- Guest mode data stays local only

---

## 📱 Cross-Platform Support

- ✅ Desktop browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ✅ Progressive Web App capabilities
- ✅ Offline functionality with localStorage fallback

---

This setup provides a robust, scalable authentication and data storage solution for the AI Art Challenge app! 🎨
