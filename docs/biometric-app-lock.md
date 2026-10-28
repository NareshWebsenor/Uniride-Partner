# Biometric app lock

> Deferred source only: App does not mount this gate and Settings does not show
> its switch. Existing preference/credentials are preserved. The sections below
> describe the retained legacy implementation, not active starter protection.
> See [starter setup](starter-setup.md) before future integration.

## Behavior

The branded splash is shown while app preferences load. The normal splash route
then resolves the existing startup destination. If app lock is enabled and the
customer session is active, the native Keychain biometric prompt opens after a
protected route is mounted. The app-lock modal is hidden while preparing or
displaying the native prompt. If app lock is off, no biometric prompt is requested.

The main screen stays visible behind the operating-system prompt. When the prompt
is cancelled or authentication fails, the non-dismissible app-lock modal appears.
It shows “App is locked”, an authentication requirement message, and one Unlock
button. Only this button retries the native prompt; backdrop taps and Android
Back cannot dismiss the card. Home stays visible through the themed translucent
backdrop, but its touches and accessibility descendants are blocked. Pressing
Unlock hides the modal while the next authentication attempt runs. Home remains
blocked even when the modal is hidden. Successful authentication and the existing
session check unlock access without showing the retry modal. Moving to inactive or
background locks the app. Returning to active starts one authentication request;
duplicate foreground notifications do not start duplicate prompts. If a native
request is still pending, the next foreground event waits for it to finish.

The native prompt accepts biometrics or the device credential where the OS and
Keychain support that combination. iOS uses the device passcode; Android 11 and
newer use the system PIN, pattern, or password fallback with the current
Keychain version. Older Android versions may offer biometrics only. The system
controls the prompt and its backdrop. A cancelled prompt leaves the app locked;
the user can press Unlock to retry or choose device credentials in the system
prompt. Errors do not disable the preference or expose protected screens.

The device credential only unlocks the local app lock. If the backend session
expires, the app still returns to Login because the device PIN or pattern cannot
renew a customer session.

## Storage and native setup

- `BIOMETRIC_APP_LOCK_ENABLED` is a standalone AsyncStorage preference.
- Keychain stores only a non-secret sentinel protected by
  `BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE`; it stores no app password or bearer
  token.
- A missing sentinel is recreated only through the protected Keychain write and
  native authentication flow. Existing iOS sentinel records are migrated after
  successful authentication so later prompts can offer device passcode.
- iOS uses `WHEN_UNLOCKED_THIS_DEVICE_ONLY` and declares
  `NSFaceIDUsageDescription` in `ios/BharatTalk/Info.plist`.
- Android biometric permissions are merged from the Keychain native module.
  The library is autolinked; iOS pods must be installed and both platforms must
  be rebuilt after dependency installation.
- Device biometric availability and enrollment are checked before enabling the
  preference. Enabling also reads the protected sentinel once before saving the
  preference.

## Session boundary

The gate checks local token presence and its locally stored expiry. It does not
validate a session with the backend, and successful biometrics do not prove the
server still accepts that session. Existing API authorization handling remains
responsible for server rejection.

At the user's explicit choice, existing access and refresh tokens remain in
AsyncStorage. That preserves the current auth integration, but it does not meet
the stricter requirement to keep tokens out of plain-text storage; migrating
those tokens needs a separate approved auth-storage change.

## Implementation

- `src/components/auth/BiometricAppLockGate.tsx` owns the splash-to-protected
  route handoff, AppState listener, prompt de-duplication, queued foreground
  events, and locked-content interaction blocking.
- `src/components/auth/BiometricLockModal.tsx` renders the themed, translated
  single-action card in the React tree, avoiding a second native modal window
  that could compete with the system authentication prompt.
- `src/navigations/Application.tsx` reports root route changes so the first
  native prompt waits until the splash has navigated into the app.
- `src/service/biometricAppLock.ts` owns Keychain access and the separate
  preference.
- `src/screens/settings/components/BiometricAppLockPreference.tsx` lets the
  customer enable or disable app lock in Settings.
- `src/service/startup.ts` exposes the local-session expiry check used before
  protected navigation is revealed.
