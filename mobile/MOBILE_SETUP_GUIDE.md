# Mobile Setup & Troubleshooting Guide

This document tracks the issues encountered during the initial setup of the mobile application and the solutions implemented to resolve them.

## ⚠️ Issues Encountered

### 1. Expo SDK Version Mismatch
*   **Problem:** The project was initially configured for older Expo SDKs (50/52), but the **Expo Go** app on the phone was updated to **SDK 54**.
*   **Result:** Error: `Project is incompatible with this version of Expo Go`.

### 2. Node.js v24 Compatibility
*   **Problem:** Node.js v24 (currently used) has strict package resolution. Newer versions of certain dependencies (like `unique-string` used by `expo-asset`) were missing the `crypto-random-string` peer dependency.
*   **Result:** `PluginError: Unable to resolve a valid config plugin for expo-asset... Cannot find module 'crypto-random-string'`.

### 3. Windows Long Path Errors
*   **Problem:** Windows PowerShell `Remove-Item` Command failed when trying to delete `node_modules` because of deep directory structures.
*   **Result:** `Remove-Item : Cannot remove item... The directory is not empty.`

### 4. Missing Screen Files
*   **Problem:** Navigation logic (`ProviderTabs.js`, `CustomerTabs.js`) referenced files that were planned but not yet created.
*   **Result:** `Android Bundling failed: Unable to resolve "../screens/customer/ProviderDetailScreen"`.

### 5. Native Module Crash (PlatformConstants)
*   **Problem:** Bundling succeeded once, but the app crashed on the phone because the native binaries in Expo Go didn't match the JavaScript bundle versions.
*   **Result:** `Invariant Violation: TurboModuleRegistry.getEnforcing(...): 'PlatformConstants' could not be found`.

---

## ✅ Steps Taken (The Approach)

### 1. SDK Upgrade
We upgraded the entire mobile project to **Expo SDK 54** to perfectly match the target device, ensuring compatibility with the latest Expo Go app.

### 2. Dependency Fixes
*   Manually installed `crypto-random-string` to fix the `expo-asset` bundling error.
*   Used `npx expo install --fix` to force all native modules (like `react-native-maps`, `expo-location`, etc.) to use versions strictly validated for SDK 54.

### 3. Clean Environment Strategy
To solve Windows path issues and corrupted caches:
*   Used `cmd /c "rmdir /s /q node_modules"` (The more robust Windows way to delete deep folders).
*   Always started the app using `npx expo start -c` to clear the Metro bundler cache.

### 4. Implementation of Missing Assets
Created the following screens to complete the navigation tree:
*   `ProviderDetailScreen.js`
*   `BookingHistoryScreen.js`
*   `ProfileScreen.js` (Customer & Provider versions)

---

## 🚀 How to Run Successfully
If you ever face caching or version issues again, follow this "Nuke & Boot" sequence:

1.  Stop any running Expo process (`Ctrl + C`).
2.  Clean everything:
    ```powershell
    cmd /c "rmdir /s /q node_modules"
    Remove-Item -Force package-lock.json
    ```
3.  Reinstall:
    ```powershell
    npm install
    ```
4.  Start with Cache Clear:
    ```powershell
    npx expo start -c
    ```
