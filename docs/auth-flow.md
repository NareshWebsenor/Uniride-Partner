# Module 2 — Auth Flow

Module 2 partner authentication UI preview document karta hai.
[Module index aur Module 1 — Splash aur Biometric](starter-setup.md).
Module 1 ke splash ke baad ye flow open hota hai; biometric gate abhi deferred hai.

## Scope and journeys

Startup restores theme/language, shows the existing splash, then opens LoginScreen.
Every cold start returns to this preview, irrespective of old session tokens.

- Login: email + nonempty password → Home (preview navigation only).
- Register: first name, optional last name, email → four-digit email code →
  mobile number → password/confirmation → terms checkbox + Continue → Fleet/Own selection in
  [Module 3 — Driver Onboarding](driver-onboarding.md).
- No SMS OTP or real KYC verification. Driver onboarding UI follows registration in Module 3.
- Home retains Settings for theme/language selection.

No API is called, email sent, credential checked, account created or token stored.
Any four digits unlock the next UI step. This is not an authentication boundary.
Remember me is visual state only. Drafts are component state and disappear on unmount.

## Components and decisions

Auth filenames identify their existing roles; existing auth components stay together.
Module 3 adds its own named screens/routes outside the auth folder.
`LoginScreen.tsx` exports `LoginScreen`; navigation types, the root navigator and
splash startup destination all use the `LoginScreen` route ID. `LoginRegisterScreen.tsx` retains both tabs; `OtpVerificationSteps.tsx`
retains OTP, mobile, password and terms steps together. File and root route names
are aligned. Tabs and auth-step Back behavior are unchanged; registration now hands off to Module 3, while login opens Home.

- `src/screens/auth/LoginScreen.tsx`: local steps, Android Back, preview completion,
  resend cooldown and footer. Uses the existing `AppBackground` wrapper.
  Login/register and all verification steps inherit this one screen wrapper.
  Entry uses `extendUnderStatusBar`: the hero image reaches the top edge behind
  a transparent status bar. Safe-area padding is applied inside the hero so its
  text stays clear of the cutout. Verification steps retain normal top insets.
  The entry hero is absolutely positioned behind a full-viewport scroller. Its
  transparent top spacing initially reveals the image; the opaque rounded
  Login/Register panel moves upward over the image as the user scrolls, then its
  remaining content scrolls normally. The hero never moves. Panel height follows
  its content, without a forced viewport minimum or expanding spacers.
  keyboard-controller's `KeyboardAwareScrollView` reveals focused fields.
  Google and Customer/Book Ride are separated by a fixed responsive gap, not an
  expanding spacer. Book Ride has only the normal panel padding beneath it.
  Entry does not nest a keyboard-avoiding view around that keyboard-aware scroller.
- `LoginRegisterScreen.tsx`: login/register tabs, hero and validated entry forms.
- `OtpVerificationSteps.tsx`: email, mobile, password and terms composition.
- `AuthFields.tsx`: password checklist and themed Google mark only.
- Each screen/component declares its own required styles below the component.
- `src/utils/authPreview.ts`: pure email masking and validation helpers.
- `src/service/startup.ts`: unconditional preview destination; session helper
  remains available to the inactive biometric implementation.

Custom components are the screen-facing API: `AppBackground`, `StackHeader`,
`CustomTextInput`, `CustomButton`, and the existing custom checkbox adapter.
The existing canonical UI components remain underneath those adapters.
Screen styles use `createStyle(theme: themeType) => StyleSheet.create(...)`,
consumed through `useThemedStyles(createStyle)`. Colors and state variants belong
in that factory; JSX references named styles instead of inline style objects.
Keep the factory at the bottom of the same screen/component file, not in a
separate stylesheet file. Splash and custom components follow the same pattern.
Safe-area values are inputs to AppBackground's style factory.
Screens do not implement native text inputs or a second password toggle.
`CustomTextInput.otpLength` renders digit cells around the shared input, supporting
paste/autofill. `left` supplies the mobile country-code prefix. StackHeader accepts
optional divider/subtitle styling; AppBackground accepts a background override and
uses the resolved theme for status bar text. Existing component defaults are retained
except the header now uses semantic typography/spacing and supports wrapping titles.

The original preview added no dependencies or native identity/signing changes.
Colors now come from the user-edited palettes in `src/utils/theme.utils.ts`.
Forgot Password, Book Ride and Terms/Privacy text links use `brandLink`, whose
dark-blue Light value and light-blue Dark value remain readable on their surfaces. Button fills
continue to use `primary`. Existing translation keys are reused; new copy lives
under `partnerAuth` in both English/Hindi resources. This follows `.agents` rules.

`src/assets/images/auth-coast.png` is a generated reference-inspired coastal car
banner, not the original screenshot asset. It has no embedded interface text.

## Validation and edge cases

- First name required, last name optional; names capped at 60 characters.
- Email trimmed for validation/display. Example: test@gmail.com → t**t@gmail.com.
  Short local parts are masked too; original email stays out of the OTP screen.
- Four-digit code required to continue. Resend clears it, starts a 30-second cooldown
  and shows unavailable feedback; it never reports actual delivery.
- Changing email resets code/cooldown. Back preserves draft values.
- Country selector: India, Bahamas, US, UK. Ten-digit national number excludes dial
  code. This UI list is not a global phone validation contract.
- Password: eight characters, a digit, a non-digit, matching confirmation. Live
  checks and visibility toggle use existing components. No credential persistence.
- Agreement required. Legal links, Google, Forgot Password and Book Ride show
  translated unavailable feedback until actual destinations exist.
- Scrollable forms, safe areas, scalable text and accessibility states enabled.
  LoginScreen uses `KeyboardAvoidingView` from `react-native-keyboard-controller`
  with `behavior="padding"` on Android and iOS. `automaticOffset` measures its
  screen position inside AppBackground's safe-area padding. Only form content
  is inside the avoiding view. Back/Continue stay in a sibling footer at the screen
  bottom and are covered by the open keyboard instead of moving above it.
  Dismissing the keyboard reveals the footer in its original position.
- Only safe step/completion event codes enter the dev-only logger.

## Verification

### Keyboard controller integration

`react-native-keyboard-controller@^1.23.1` was already installed (lockfile resolves
1.23.1). `App.tsx` now mounts one `KeyboardProvider` around the application,
inside the existing SafeAreaProvider. The installed Reanimated dependency and
Worklets Babel plugin satisfy the existing animation setup. Jest uses the
library's supplied mock; unit tests do not simulate native keyboard animations.
See the [library setup](https://kirillzyusko.github.io/react-native-keyboard-controller/docs/installation)
and [avoiding-view API](https://kirillzyusko.github.io/react-native-keyboard-controller/docs/api/components/keyboard-avoiding-view).

Native binaries need rebuilding after installing the package. For Android, use
`./gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a` from `android/`
for the verified ARM64 device ABI. For iOS, run
`bundle exec pod install` from `ios/` before building. Validate keyboard open,
input switching, scrolling, footer access and dismissal on both platforms.

Integration verification (2026-11-17):

- Android command above: exit 0, native keyboard-controller compiled/autolinked;
  debug APK installed on `emulator-5554` (ARM64, Android API 36).
- Emulator login form: email keyboard opening, scrolling to Continue, switching
  to password keyboard and Android Back dismissal inspected successfully.
  Screenshots: `/private/tmp/uniride-keyboard-open.png`,
  `/private/tmp/uniride-keyboard-scrolled.png`,
  `/private/tmp/uniride-keyboard-password.png`,
  `/private/tmp/uniride-keyboard-dismissed.png`.
- Metro runs on 8081 with `adb reverse tcp:8081 tcp:8081` for this emulator.
- `yarn test --runInBand`: 35 pass / same eight baseline failures.
  `yarn type-check`: same three pre-existing errors; `yarn check:ui` and
  `git diff --check` pass. Existing ESLint config remains absent.
- iOS setup is blocked before this integration can be validated: Ruby 3.2
  `bundle exec pod install` exits 1 because locked gems (including CocoaPods
  1.15.2) are missing. Simulator build below exits 65 because
  `Pods-UniRidePartner.debug.xcconfig` and Pods file lists are absent.
  This is an existing dependency-setup problem, not a keyboard compilation error.
  Physical-device and iOS keyboard checks remain pending.

```sh
xcodebuild -workspace ios/UniRidePartner.xcworkspace \
  -scheme UniRidePartner -configuration Debug -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath /private/tmp/uniride-keyboard-ios-build \
  CODE_SIGNING_ALLOWED=NO build
```

`__tests__/partner-auth.test.tsx`: masking, validation, registration/back flow,
resend cooldown, login preview and live Hindi/Dark changes. Startup tests expect
LoginScreen. Commands: `yarn test --runInBand`, `yarn type-check`, `yarn check:ui`.

Auth/startup focused run: 10/10 tests passed. Theme/translation guard and diff checks
passed. Existing Android emulator + Metro exercised registration through Home;
masked OTP, digit entry, password rules and agreement gating were inspected.
OTP native-text duplication found during inspection was fixed in CustomTextInput.
Physical-device and iOS checks were not run; no native files were changed.

Repository baseline comparison on 2026-11-17 reproduced eight failures across the
biometric gate, biometric service, legacy UI and logout suites. Existing type errors
are in TextArea, CardImageComponent and ThemeProvider; ESLint configuration is absent.
Do not confuse those baseline failures with passing auth/startup checks.

See [starter setup](starter-setup.md) for Metro, device and recovery commands.
Real auth needs partner API contracts and server verification before production use.
