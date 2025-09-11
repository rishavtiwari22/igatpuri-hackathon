#!/bin/bash

echo "🔍 Firebase Configuration Checker"
echo "================================="
echo ""

# Check if .env file exists
if [ -f ".env" ]; then
    echo "✅ .env file found"
    
    # Check each required variable
    if grep -q "VITE_FIREBASE_API_KEY=" .env; then
        echo "✅ API_KEY configured"
    else
        echo "❌ API_KEY missing"
    fi
    
    if grep -q "VITE_FIREBASE_PROJECT_ID=" .env; then
        echo "✅ PROJECT_ID configured"
    else
        echo "❌ PROJECT_ID missing"
    fi
    
    if grep -q "VITE_FIREBASE_DATABASE_URL=" .env; then
        echo "✅ DATABASE_URL configured"
    else
        echo "❌ DATABASE_URL missing"
    fi
else
    echo "❌ .env file not found"
fi

echo ""
echo "🔧 Next Steps:"
echo "1. Ensure Firestore is enabled in Firebase Console"
echo "2. Check security rules are properly configured"
echo "3. Verify billing account is set up (if required)"
echo "4. Run the app and check the Firebase Debug panel"
echo ""
echo "🌐 Firebase Console: https://console.firebase.google.com/project/img-prompt-project"
