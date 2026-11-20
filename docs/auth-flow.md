# Module 2 — Auth Flow

[Module index aur Module 1 — Splash aur Biometric](starter-setup.md) ·
[Module 3 — Driver Onboarding](driver-onboarding.md)

Status: driver email verification and email/password login are connected to the
provided API contract. Native account creation/login against a real test account
has not been verified. Biometric app lock remains deferred.

## Active journeys

Startup hydrates preferences, shows Splash, and restores a valid driver session
from Keychain. An active session opens Home; otherwise LoginScreen resumes an
editable registration or its saved review state, when available.

- Login: email + password → `POST /v1/driver-auth/login` → secure session → Home.
- Registration keeps the original product fields/screens: first name, optional
  last name, email → six-digit email OTP → mobile → Create password → terms →
  API-defined personal/document form → Fleet/Own → review → Under review.
- Create password is active after email verification and the optional mobile step.
  Password and confirmation must match the existing client checklist (8+ characters,
  a digit and a non-digit); the server remains authoritative. Continue calls
  `POST /v1/driver-registration/password` with `{ token, password }` and advances
  only after `{ password_set: true }`. Confirm password is never sent. Both inputs
  are memory-only and cleared after success; the credential stores only a
  non-secret `passwordSet` marker to resume without bypassing unfinished setup.
- `email-code` and resend send `{ first_name, last_name, email }`. First/last name
  and local agreement also prefill matching enabled `first_name`, `last_name`,
  `accept_terms` fields without overwriting existing server answers.
- Mobile stays optional. Empty Continue skips the phone request. A filled number
  calls `setRegistrationPhone(token, phone)` in `src/service/rest/auth.ts`:
  `POST /v1/driver-registration/phone` with `{ token, phone }`, combining the
  selected country dial code and national digits (for example `+919812345678`).
  Only a valid `{ phone: string }` response advances to password. Pending requests
  disable editing and repeated Continue taps; failures stay visible for retry,
  and expired credentials return to email verification. Server validation remains
  authoritative. Phone is not cached locally or included in dynamic form answers.
- Google sign-in is hidden. SMS verification and Forgot password have no driver
  backend. The phone endpoint saves the number without SMS verification. The app never
  offers the admin-only staff/hybrid/freelancer assignment.

## API and environment

The active driver service uses `/v1`, independently of the preserved legacy
customer `/api/v1` client. Configure the ignored root `.env` using `.env.example`:

```dotenv
DRIVER_API_BASE_URL_DEV=https://19sntv0h-3000.inc1.devtunnels.ms
DRIVER_API_BASE_URL_PROD=
UNIRIDE_WORKSPACE=uniride
```

Use the origin only; `src/service/config.ts` appends `/v1`. Production origin is
required at release. Every driver registration/auth request includes lower-case
`X-Uniride-Workspace`; there is no tenant-ID parameter. JSON requests use
`Content-Type: application/json`; file uploads use their actual supported MIME.

`src/service/config.ts` owns `ENDPOINTS.DRIVER_AUTH` and
`ENDPOINTS.DRIVER_REGISTRATION`. `service/rest/auth.ts` supplies auth/registration
functions through `_makeAxiosPostRequest` from `./index`; `registrationResponse.ts`
validates response schemas. `driverRegistration.ts` only re-exports the functions
for older imports. Active hooks import `auth.ts`.

Shared GET/POST helpers accept `{ api: 'driver' }` to select the separate Axios
instance in `driverClient.ts`. This keeps the driver `/v1` origin, workspace,
Keychain session, 30-second timeout, cancellation and `Retry-After` errors separate
from the legacy customer `/api/v1` refresh interceptor. Auth/registration calls
do not attach a login bearer. Authenticated driver calls additionally pass
`authenticated: true`; a 401 clears that session without attempting refresh.
Helpers return response bodies. Registration uploads pass a raw Blob and its MIME
header, never multipart. Existing legacy helper calls retain their old behavior.

Example service call (the registration form uses POST):

```ts
import { _makeAxiosPostRequest } from './index';
import { ENDPOINTS } from '../config';

const response = await _makeAxiosPostRequest(
  ENDPOINTS.DRIVER_REGISTRATION.FORM,
  { token },
  { api: 'driver' },
);
```

No new API logging is added; raw response debug prints have been removed from the
auth service. Order APIs remain deferred until their backend contract is available.
Screens use hooks/services, not direct HTTP. No dependency, signing,
native identity or permission change is required by this integration.

## Email verification and state routing

`email-code` receives the names and email, then sends a six-digit code valid for ten minutes. Resend is disabled for
60 seconds after a successful request; only the newest code is accepted by the
server. A 429 extends the lock using `Retry-After`, including HTTP-date headers.
The countdown uses wall-clock deadlines so background/resume does not reset it.

At the user's explicit request, a valid six-digit `development_code` autofills
only in `__DEV__`. Production discards the field and relies on emailed codes.
Code verification is still performed by the API; there is no local acceptance.

`verify` branches on its state:

- `invited`: editable application; save registration token securely.
- `changes_requested`: editable application; show the server reason and answers.
- `pending_review`: Under review; no app login session is created.
- `activation_pending`: Approved; explain the emailed browser activation link.
- `active`: return to email/password login.

After submit or reinstall, status is checked through email → code → verify again.
The app does not poll with a consumed registration token. In-app activation/deep
links are not implemented; follow the approval email for any remaining browser activation steps.

## Secure sessions and failures

`src/service/driverSession.ts` stores registration and login credentials in
separate Keychain services scoped to workspace and API origin. Registration
credentials contain the application identity, server expiry and password-set marker; they cannot
unlock Home. Login stores the session, expiry and minimal driver response in
Keychain. Zustand `authStore` owns the in-memory session without persisting tokens
in AsyncStorage. Legacy plaintext auth keys are removed during session migration.

Login expiry follows `expires_in` (contract: 12 hours). There is no refresh token.
Expired sessions or authenticated 401 responses lock the protected routes and
return to login. Registration 401/409 returns to fresh email verification; old
codes are not silently replayed to recover an application state.

Logout clears memory immediately and removes the secure session. A non-secret
logout marker prevents a failed Keychain deletion from restoring that session
on the next launch. Storage failures are surfaced instead of reported as success.
Passwords, OTPs, tokens, profile details and raw API errors are never logged.

Backend `error.message` is shown unchanged. Local network/configuration/storage
failures use translated copy. Validation remains visible at the form; 413 maps
to the five-MB upload limit, 429 locks repeated actions, and 503 can be retried.
Concurrent submit/login taps are blocked while work is running.

## Components and layout

- `LoginScreen.tsx` composes the original steps with `useDriverAuth`.
- `LoginRegisterScreen.tsx` retains both tabs, coastal hero and entry fields.
- `OtpVerificationSteps.tsx` retains email/mobile/password/terms controls.
- `useRetryCountdown.ts` handles resend/rate-limit deadlines.
- `registrationEntry.ts` keeps only non-secret schema-prefill candidates.
- `startup.ts` restores the secure driver session; the legacy customer-session
  helper remains only for the inactive biometric implementation.

The existing `AppBackground`, canonical UI adapters and one root KeyboardProvider
are reused. The entry hero extends behind the transparent status bar; its own
safe inset protects content. A full-viewport keyboard-aware scroller moves the
rounded panel over the stationary hero. Verification steps use normal safe insets,
scrollable content and a bottom footer outside keyboard avoidance.

Theme colors remain centralized. English/Hindi/Spanish and saved text scaling
apply to app-authored copy; server labels/options/messages are shown verbatim.
`authPreview.ts` retains useful email masking/validation helpers; its name does
not indicate that the active API authentication path is a preview.

## Verification and remaining integration

Phone endpoint/Continue update: `yarn test --watchman=false --runInBand
__tests__/driver-api.test.ts __tests__/partner-auth.test.tsx` passes 69/69 tests.
Coverage includes exact phone request headers/body, malformed responses, optional
skip, save-before-navigation, duplicate taps, failure/retry and missing credentials.
`yarn check:ui` and `git diff --check` pass. `yarn type-check` still reports the
two pre-existing TextArea/CardImageComponent errors; `yarn lint` cannot run because
ESLint configuration is missing. Live phone API and device checks remain unrun.

Latest Axios/service-organization update: 92/92 tests pass across five focused
auth/API/session/registration/upload suites. These exercise real Axios request
serialization and response transforms through a mocked adapter, driver-vs-legacy
helper routing, JSON/raw-byte payloads, cancellation, timeout and session handling.
Full `yarn test --watchman=false --runInBand`: 326 pass, 8 existing failures in
legacy logout, shared UI and deferred biometric tests. `yarn type-check` reports
the same two baseline UI errors; `yarn lint` is blocked by missing ESLint config.
`git diff --check` passes. No live account requests or native builds were run for
this transport refactor.

Previous password/names/optional-mobile update: 104/104 focused tests pass across
seven auth/API/session/form/localization suites. These cover exact request bodies,
password success/failure/retry and duplicate prevention, blank/filled mobile,
legacy phone omission, secure password-set marker and restart routing.
Type-check still reports only the two baseline errors below; UI rules/diff checks
pass. This endpoint update has not been exercised with an authorized live account.

API/session, auth-hook, registration-flow/draft, dynamic field, upload and vehicle
suites cover the contract with mocked networking. Previous full-integration focused
run: 138/138 pass across 13 suites. Previous full regression: 311 pass, 8 existing failures in legacy logout,
shared UI and deferred biometric suites. Run targeted suites with `yarn test --watchman=false
--runInBand`, plus `yarn type-check`, `yarn check:ui` and `git diff --check`.

Android emulator auth entry and restored First/Last name fields were inspected
using the existing Metro server (`/private/tmp/driver-register-restored.png`).
Unauthenticated `GET /v1/driver/me` returned 401, establishing endpoint reachability
only. No approved test email/account was supplied, so real email delivery,
verification, authenticated login, document upload and final submission remain
unverified. Do not treat the reachability check as successful authentication.

Baseline TypeScript issues remain in TextArea and CardImageComponent; ESLint
configuration is absent. No new native build was needed for this JS integration.
UI theme/translation guard and `git diff --check` pass; type-check has only the
two baseline errors named above.
Physical-device and iOS account-flow validation remain pending.

The previous UI-only four-digit OTP and direct-to-Home registration were replaced.
Historical keyboard verification used Android ARM64/API 36 and existing
`react-native-keyboard-controller`; iOS previously failed dependency setup because
locked gems/Pods files were missing. These earlier checks do not validate the new
API journey. Device/build/recovery commands remain in [shared setup](starter-setup.md).
