# Market Pulse Android App

This directory contains a native Android wrapper for the existing Market Pulse web app.

## Features added
- Native Android app shell with `WebView` loading local bundled web assets.
- Background price alert notifications (Binance symbol + target price, above/below trigger).
- App open analytics: stores total open count and timestamp log of each launch.

## Build
1. Sync web assets after web changes:
   ```bash
   ./scripts/sync-android-assets.sh
   ```
2. Build debug APK:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

## Usage
- Open app menu in top-right:
  - **Set alert**: configure a Binance pair price trigger.
  - **Open logs**: view open count and all launch timestamps.

> Note: background checks run every 15 minutes (Android WorkManager minimum interval).
