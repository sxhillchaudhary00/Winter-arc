# WINTER ARC — 1 Oct to 31 Dec 2026 habit tracker

React + Vite app. Data localStorage me save hota hai (offline, no backend).

## Computer par chalane ke liye
    npm install
    npm run dev          # browser me test
    npm run build        # dist/ folder banata hai

## Android APK banane ke liye (Capacitor)
Zaroori: Node 18+, Java 17, Android Studio (Android SDK ke saath)

    npm install
    npm run build
    npm run android:add      # sirf pehli baar (android/ folder banata hai)
    npm run android:sync     # har code change ke baad
    npm run android:open     # Android Studio khulega

Android Studio me:
  Build > Build Bundle(s) / APK(s) > Build APK(s)
APK yahan milega: android/app/build/outputs/apk/debug/app-debug.apk

Play Store ke liye: Build > Generate Signed Bundle / APK.

App icon badalna ho to Android Studio me
  android/app -> right click -> New -> Image Asset
