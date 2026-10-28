# Project starter

## Current flow

App preference hydration -> existing Uni Ride splash (700 ms) -> Home -> Settings.

Login, signup, OTP, verification/KYC redirects, onboarding, finance tabs and
profile/logout UI have been removed. Home performs no API request. Startup ignores
old session/onboarding/KYC values and does not erase them. Settings retains
Light/Dark/System and English/Hindi using the existing persisted stores.

## Biometric code is deferred

The user's explicit choice is to preserve biometric source without activating it.
`App.tsx` mounts `Application` directly. Settings does not render the biometric
switch, even when an existing device has `BIOMETRIC_APP_LOCK_ENABLED=true`.
No app lock is enforced by this starter.

These files remain byte-for-byte unchanged:

- `src/components/auth/BiometricAppLockGate.tsx`
- `src/components/auth/BiometricLockModal.tsx`
- `src/components/auth/BiometricLockScreen.tsx`
- `src/context/BiometricAppLockContext.ts`
- `src/service/biometricAppLock.ts`
- `src/screens/settings/components/BiometricAppLockPreference.tsx`

The deferred gate still depends on `hasActiveCustomerSession`, `onLogout`, the
`MainStack` route ID and Application's optional `onRouteChange` prop. Those
compatibility boundaries remain; `MainStack` now renders Home directly and legacy
session cleanup resets to Home. REST/session stores and native Keychain dependencies
are retained for this source compatibility. OTP request/verification APIs and their
screens have been removed. The gate must be decoupled from login/session state
before a future standalone app-lock integration. Existing biometric documentation
below describes the preserved implementation, not active starter behavior.

## Files and decisions

- `App.tsx`, `src/navigations/Application.tsx`: three root routes only; no active
  biometric gate, auth sheet, version request or connectivity blocking modal.
- `src/service/startup.ts`: unconditional Home destination; legacy session helper
  retained for deferred biometric code.
- `src/screens/splash/SplashScreen.tsx`, `src/components/layouts/auth/BrandLogo.tsx`: same visual
  splash and existing transition timing.
- `src/screens/main/tab/HomeScreen.tsx`: minimal Home with Settings action.
- `src/screens/settings`: appearance/language only; demo and logout UI removed.
- Navigation types, component exports, old tab/onboarding constants and auth-only
  helpers cleaned alongside removed screens.
- No native identity, signing, permissions, dependency or lockfile changes.
  Actual checked-in Android identity is `com.uniride`; older repository notes say
  BharatTalk. This task preserves the actual native files.

## Development and recovery

Prefer a physical wireless Android device:

```sh
adb pair <device-ip>:<pair-port>
adb connect <device-ip>:<debug-port>
adb devices -l
adb reverse tcp:8081 tcp:8081
adb reverse --list
```

Reuse Metro for this directory. Start `yarn start` only if it is not already
running. A Metro serving another checkout is not a valid server for this project.
During this cleanup port 8081 served the sibling `UniRide` folder; project Metro
was started on 8082 with `yarn start --port 8082`. The emulator bundle location
was temporarily switched through the dev menu to `10.0.2.2:8082`; the bundle
compiled, but the installed app did not render and reverted to 8081 on restart.
Native UI verification is therefore blocked, not passed. The temporary server
was stopped after checking; start it again explicitly for further diagnosis.
For a physical device using that port: `adb reverse tcp:8082 tcp:8082` and set the
dev-menu bundle location to `localhost:8082`.

After reconnect: restore reverse -> verify Metro directory/port -> relaunch app.
Use Fast Refresh for JavaScript changes; no native build is required by this change.
If a binary is needed, inspect `adb shell getprop ro.product.cpu.abi`, then build
only that ABI (example below), without a default clean/universal build:

```sh
cd android
./gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`.
Install: `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`.
Launch: `adb shell am start -n com.uniride/.MainActivity`.

## Verification

- Focused starter, App hydration/deferred-biometric, theme and language suites:
  25 tests pass across four suites. `yarn test --runInBand`: four suites pass
  and four fail (30 tests pass, eight fail). Existing biometric and legacy logout failures remain.
  UI suite previously failed during import; after logout UI removal it loads
  and reports button/radio/toast test mismatches; these are not claimed as passed.
- `yarn type-check`: three existing errors remain in TextArea,
  CardImageComponent and ThemeProvider; baseline had eight errors.
- `yarn lint`: blocked by the repository's missing ESLint configuration.
- `yarn check:ui`: passes.
- Hash verification confirms all six biometric source files unchanged.
- Physical-device biometrics and iOS testing are deferred; this task does not
  activate biometrics or modify native code.

The starting repository had no commits and all project files were untracked.
Work uses `feature/project-starter`; no commit or push was made. A pre-cleanup
source backup is at `/private/tmp/uniride-starter-before-cleanup-20261028.tar.gz`.
