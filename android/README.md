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

If the Gradle wrapper is not present in your local clone, use:
```bash
gradle :app:assembleDebug
```

## Publish on GitHub
A CI workflow is included at `.github/workflows/android-release.yml`.

- Run manually from **Actions → Android APK Build & Publish** using `workflow_dispatch`, or
- Push a tag that starts with `android-v` (example: `android-v1.0.0`).

The workflow will:
1. build release APK file(s) under `android/app/build/outputs/apk/release/`,
2. upload all generated release APKs as workflow artifacts,
3. attach those APK files to a GitHub Release for tag runs.

## Usage
- Open app menu in top-right:
  - **Set alert**: configure a Binance pair price trigger.
  - **Open logs**: view open count and all launch timestamps.

> Note: background checks run every 15 minutes (Android WorkManager minimum interval).
