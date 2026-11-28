# Project Documentation — Module Index aur Shared Setup

## Module order

Feature documentation hamesha is stable numbering ko follow kare:

1. **Module 1 — Splash aur Biometric**: preference hydration, splash/startup
   handoff aur local app-lock lifecycle. Splash active hai; biometric gate aur
   Settings switch abhi deferred/inactive hain.
   [Splash/startup](#module-1--splash-aur-biometric),
   [biometric implementation](biometric-app-lock.md),
   [doosre app mein biometric integration](fingerprint-lock-integration.md).
2. **Module 2 — Auth Flow**: driver login (`POST /v1/driver-auth/login`) + profile
   (`GET /v1/driver/me`), email sign-up, 4-digit email OTP, conditional mobile +
   4-digit phone OTP, password setup, and secure session lifecycle.
   [Auth flow aur verification](auth-flow.md).
3. **Module 3 — Driver Onboarding**: `drive-mode` selection → conditional 6-digit
   fleet invitation code or `vehicle-options` + papers → API-defined personal/document
   form (`first_name`/`last_name` included; `email`/`phone` excluded from `answers`)
   → Terms (`accept_terms: true`) + submit → Under review. Old city/bank/checklist
   previews are retained as inactive legacy screens.
   [Driver onboarding flow aur validation](driver-onboarding.md).
4. **Module 4 — Home aur Bottom Tabs**: Home, Trips, Earnings, Inbox, Menu navigation
   active; Trips, Earnings and Inbox open Modules 5, 6 and 7 UI previews.
   Menu has demo profile and working
   theme/language preferences (English/Hindi/Spanish), saved app-wide text size aur Menu detail screens.
   [Tab flow aur verification](main-tabs.md).
   [Module 4 — Text Size](text-size.md).
   [Module 4 — Menu Details](menu-details.md).
   [Module 4 — Home Ride Preview](home-rides.md): availability, 15-second requests,
   Arriving and OTP/Start Trip; demo data, backend deferred.
5. **Module 5 — Trips UI**: Completed, Upcoming and Incomplete lists with
   scheduled/completed/cancelled/missed details. Local demo data and SVG route
   illustrations only; all contact/cancel/navigation actions show a preview dialog.
   [Module 5 — Trips UI](trips.md).
6. **Module 6 — Earnings aur Wallet UI**: All Earnings/Wallet tabs, Day/Week/Month
   demo periods, chart and wallet balance/cash-limit cards. Financial actions only
   show preview dialogs; no payment or earnings API is connected.
   [Module 6 — Earnings aur Wallet UI](earnings.md).
7. **Module 7 — Inbox aur Chat UI**: All/Unread passenger lists and local chat
   timelines with typed messages and quick replies. In-memory demo state resets
   on restart; calls/support/trip actions show preview dialogs, with no live messaging.
   [Module 7 — Inbox aur Chat UI](inbox.md).

Current flow: **Module 1 (Splash) → secure session restore or Module 2 (Auth)**,
with root route/session guards active in `Application.tsx`.
Successful login → **Module 4 (Home aur Bottom Tabs)**; registration → **Module 3
(Driver Onboarding)** → Under review → browser activation → Module 2 login.
Theme/language controls Menu mein directly available hain.
Module 1 mein biometric documentation hone ka matlab gate enabled hona nahi hai.

Naye feature modules ko Module 8, Module 9, ... do; existing module IDs renumber
mat karo. Ek module ke related guides wahi ID use karein. Theme, localization,
responsive sizing aur build/recovery sab modules ka shared setup hain; har
supporting document ko naya feature-module number mat do.

## Module 1 — Splash aur Biometric

`App.tsx` theme/language/text-size/notification preferences hydrate karta hai aur tab tak `SplashContent`
dikhata hai. Uske baad `SplashScreen` branded transition ke liye 700ms wait karke
`src/service/startup.ts` se destination leta hai. Valid Keychain driver session
Module 4 kholta hai; otherwise Module 2 `LoginScreen` registration/status resume
handle karta hai. Startup storage error par translated retry action available hai.

Biometric implementation aur integration guide isi Module 1 ka part hain. Source
preserved hai, lekin current startup par native biometric prompt request nahi hota.
Is documentation update se app-lock runtime enable nahi hota.

## Current flow

Current startup restores a secure driver session or opens
[Module 2 — Auth Flow](auth-flow.md). Registration continues to
[Module 3 — Driver Onboarding](driver-onboarding.md); successful submission opens
Under review, not Home. Driver auth APIs are integrated; biometric gate remains
inactive. This checkout's Android identity is
`com.uniride.partner`; use that package when launching the partner app.

Registration uses the origin configured by `DRIVER_API_BASE_URL_DEV/PROD` plus
`/v1`, with `UNIRIDE_WORKSPACE` as the workspace header. The old customer `/api/v1`
transport is not used for driver auth. See Module 2 for environment, Keychain,
expiry/401 behavior and the pending signup-password backend contract.

Android emulator auth entry was verified; an unauthenticated driver/me probe
returned 401 and confirmed reachability only. Live email delivery, authenticated
login and application uploads/submission remain unverified without an approved
test account. Historical verification sections below describe their named earlier
increments, not the current API flow.

## Shared system navigation area

`App.tsx` enables `KeyboardProvider.navigationBarTranslucent`: the root app draws
behind Android's gesture/navigation area instead of leaving a white content
margin. Screen safe-area padding and the tab bar still protect interactive content.
The root background uses the active theme; `Appearance.setColorScheme` follows the
saved app preference so native controls and gesture-bar contrast match. System
mode releases that override with `unspecified` and follows the OS again.
Shared native Modal also sets `navigationBarTranslucent` alongside
`statusBarTranslucent`, allowing sheets to color their own bottom safe area.
No new dependency, permission or native identity change.

Verification: existing App/theme/tab/Menu/Home checks **21/21 passed**; UI guard
and whitespace checks pass. Android dark Login, Home/tab bar and emergency sheet
checked without the white strip (`/private/tmp/nav-dark.png`, `nav-home.png`,
`nav-sheet.png`). Login gesture indicator remains visible. Existing
TextArea/CardImageComponent type errors remain.

## Earlier starter baseline

Historical snapshot only. Its removed-screen/session behavior is superseded by
the active Module 2/3 API integration described above.

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

These files remain deferred. The responsive-sizing migration updates the two
lock views' dimensions only; biometric behavior remains unchanged:

- `src/components/auth/BiometricAppLockGate.tsx`
- `src/components/auth/BiometricLockModal.tsx`
- `src/components/auth/BiometricLockScreen.tsx`
- `src/context/BiometricAppLockContext.ts`
- `src/service/biometricAppLock.ts`
- `src/screens/settings/components/BiometricAppLockPreference.tsx`

The deferred gate still depends on `hasActiveCustomerSession`, `onLogout`, the
`MainStack` route ID and Application's optional `onRouteChange` prop. Those
compatibility boundaries remain; `MainStack` now renders Module 4 tabs and legacy
session cleanup resets to Home. REST/session stores and native Keychain dependencies
are retained for this source compatibility. Legacy customer OTP screens were
removed in that baseline; current driver email-code verification is a separate
active implementation. The gate must be decoupled from login/session state
before a future standalone app-lock integration. Existing biometric documentation
below describes the preserved implementation, not active starter behavior.

## Files and decisions — earlier starter baseline

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

### Shared screen background

`src/components/background/AppBackground.tsx` owns themed background, status bar
and safe-area padding for full screens. Its typed style options include all four
insets so portrait and landscape cutouts are respected.

- Module 1: hydration/route splash and the retained biometric lock screen use
  AppBackground directly. Biometric runtime remains deferred.
- Module 2: LoginScreen wraps the existing login/register and verification steps
  once; those nested views inherit its background and safe area.
- Home/Settings: existing ScreenWrapper delegates its outer frame to AppBackground,
  preserving ScrollView, keyboard taps, Container spacing and width limits.

Do not place another safe-area wrapper around these screens or their child forms.
SafeAreaWrapper remains AppBackground's lower-level status-bar adapter with its
own safe-area padding disabled; AppBackground applies the insets once.

### Theme palette ownership

`src/utils/theme.utils.ts` is the single palette source. The former
`src/theme/colors.ts` module has been removed. Add/edit colors in `lightPalette`
and `darkPalette`; `LightThemeColors` and `DarkThemeColors` complete the shared
contract with semantic fields and additional UI accents. Existing user-edited
palette values are retained; missing fields were filled from the previous palette.

Semantic fields reuse matching palette values: `background` follows
`backgroundColor`, `surface` follows `backgroundColorS1`, `surfaceRaised` follows
`grayS2`, and text/border/status colors follow their legacy equivalents.
Light uses white surfaces, pale-gray cards, dark text and blue actions; Dark uses
dark surfaces and light text. Links and disabled-button labels have corresponding
contrast in each palette.

Default preference is `system`: without a saved app choice the phone controls
Light/Dark, and an unavailable OS scheme falls back to Light. Settings → Appearance
offers Light, Dark and System. Explicit Light/Dark stays pinned across OS changes
and app restarts; choosing System resumes following the phone. Only the preference
is persisted under `theme-storage`, never resolved colors. Existing saved choices
are preserved. `themeStore.ts` owns resolution/persistence; `ThemeProvider` forwards
OS appearance changes. No second theme preference or forced Light override is added.

Theme correction verification: theme, auth, starter and onboarding state/UI suites
passed (37 tests); UI rules and diff checks passed. Android emulator showed the
white/blue Light palette, then switched to Dark when OS night mode changed. OS
Light was restored after the check. Manual overrides and saved-Dark hydration are
covered by store tests; iOS was not exercised.

`src/interface/theme.type.ts` owns `ThemeColors`, its `themeType` compatibility
alias and theme-mode unions, avoiding circular imports. Lowercase palette exports
are aliases of the same objects. Zustand remains the active preference owner;
the legacy Redux consumer receives the same palettes without new persistence.
Navigation and tests import the relocated definitions. Theme hooks and semantic
color usage in components remain unchanged.

`ThemeProvider` and `createNavigationTheme` also live in `theme.utils.ts`; their
former files under `src/theme/` are removed. App selects `isDarkTheme` and
`setSystemTheme` from Zustand and passes them to the provider. This prevents a
utility-to-store import cycle because the store already imports the palettes.
Provider props are declared in `src/interface/theme.type.ts`. The provider uses
React `createElement` so the utility retains its `.ts` extension. Unknown/system
color-scheme values normalize to light before reaching the existing store callback;
explicit user preferences still ignore OS changes. Navigation theme behavior and
palette values remain unchanged.

Provider consolidation checks: App hydration and theme suites pass; full suite
remains 35 passed / the same eight baseline failures. The provider's earlier
color-scheme type error is resolved by normalization; type-check now reports only
the two existing TextArea and CardImageComponent errors. Palette definitions are
unchanged, removed-file import scan is clean, and UI/diff checks pass. No native
files changed; device appearance checks were not rerun for this consolidation.

Palette migration verification (2026-11-17): original color values compared
against the pre-migration snapshot and preserved in both palettes; each completed
palette has 66 fields and compatibility aliases share the same objects. No source
or test imports reference the removed module. Theme tests pass; full suite remains
35 passed / the same eight existing failures. The two incomplete-palette type
errors are fixed; the three earlier TextArea/CardImageComponent/ThemeProvider
errors remain. UI rules and diff checks pass. Visual device checks were not rerun
for this palette change.

### Responsive UI sizing

All former sizing-token consumers now call `wp`, `hp`, and `fSize` from
`src/utils/responsive.utils.ts` directly. `useTheme()` exposes colors and theme
preferences only. The sizing token module has been removed.

- Horizontal spacing, radii, and square icons use `wp`; vertical lengths use `hp`.
- Conversion reference: 400dp width / 800dp height. For example, 16dp horizontal
  padding becomes `wp('4%')`, and 16dp vertical padding becomes `hp('2%')`.
  Shared padding/gaps use width scaling so all sides remain equal.
- Font sizes use percentages: `fSize(2)` is approximately 16dp at an effective
  800dp font reference height. The installed font library adjusts for platform
  status-bar/safe-area behavior; `fSize(16)` does **not** mean 16dp.
  Native text scaling remains enabled.
- Interactive heights use `Math.max(48, hp('6%'))` or `hp('7%')` with the same
  48dp floor. Square buttons use width scaling on both axes with a 48dp floor.
- Fixed 440dp/720dp content-width caps, zero values, hairline/border widths and
  pill radius remain intentional constraints, not a new sizing-token layer.
- Existing helper behavior is preserved: module-level styles capture dimensions
  at initialization. Live rotation/split-window reflow is not added by this change.

Check small/large phones, Hindi wrapping, enlarged fonts, OTP fit, modal dismissal,
and Light/Dark appearance on a physical device. These remain visual checks, not
claims inferred from passing unit tests.

Migration validation (2026-11-17):

- Source scan: no remaining sizing-token imports/usages; `git diff --check` and
  `yarn check:ui` pass.
- `yarn test --runInBand`: 35 pass, the same eight failures as before migration
  (four failed suites / five passed). Existing failures cover biometric gate,
  biometric service, UI assertions, and logout. Jest also reports open handles.
- `yarn type-check`: the same three errors in TextArea, CardImageComponent and
  ThemeProvider. No new TypeScript diagnostics.
- `yarn lint`: existing missing ESLint configuration blocks execution.
- `adb devices`: no connected device; physical UI verification remains pending.

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
Launch current partner app: `adb shell am start -n com.uniride.partner/.MainActivity`.

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
