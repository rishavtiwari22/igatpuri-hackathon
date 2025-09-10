#!/bin/bash
# Firebase Setup Checker
# This script opens the Firebase Console for quick setup

echo "🚨 Firebase Setup Checker"
echo "=========================="
echo ""
echo "Current project: img-prompt-project"
echo ""
echo "🔍 Checking required setup:"
echo ""
echo "1. ❓ Firestore Database - Status: UNKNOWN (needs manual check)"
echo "2. ❓ Realtime Database - Status: UNKNOWN (needs manual check)" 
echo "3. ✅ Firebase Config - Status: CONFIGURED"
echo ""
echo "🚀 Quick Setup:"
echo "1. Opening Firebase Console..."

# Open Firebase Console
open "https://console.firebase.google.com/project/img-prompt-project"

echo "2. In the console:"
echo "   📊 Click 'Firestore Database' → 'Create database' → 'Test mode'"
echo "   💾 Click 'Realtime Database' → 'Create Database' → 'Test mode'"
echo ""
echo "🔄 After setup, refresh your application!"
echo ""
echo "📝 Setup instructions also available in FIRESTORE_SETUP_URGENT.md"
