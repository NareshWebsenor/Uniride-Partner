# Module 3 — Driver Onboarding

[Module index](starter-setup.md) · [Module 2 — Auth Flow](auth-flow.md)

Status: API-driven registration form, document upload, vehicle catalog and submit
are integrated. Live-account completion is unverified. The original standalone
onboarding screens remain in the repository as inactive preview code.

## Active flow

Module 2 handles email sign-up, 4-digit email OTP, conditional phone + 4-digit
phone OTP (`phone_required: true`), and Create password. It then opens
`DriverRegistrationScreen`:

1. Choose how to drive (`POST /v1/driver-registration/drive-mode`): `fleet_partner` or `own_vehicle`.
2. Fleet with `invitation_code_required: true` verifies a 6-digit invitation code
   (`POST /v1/driver-registration/invitation-code`). Own loads vehicle options
   (`POST /v1/driver-registration/vehicle-options`) and collects vehicle details/papers.
3. Load `POST /v1/driver-registration/form` using the secure registration token and
   render enabled personal/document fields (`first_name`, `last_name`, documents, etc.;
   `email` and `phone` are excluded from submitted `answers`). `changes_requested`
   shows the server reason banner.
4. Review enabled answers, accept Terms (`accept_terms: true`), and submit
   (`POST /v1/driver-registration/submit`). Success opens Under review, not Home.

Admin assignment to staff/hybrid/freelancer is never shown or sent. Approval sends
an activation email; the driver follows its remaining activation instructions,
then logs in through Module 2 with the configured password. Corrections/status use fresh email verification.

## Schema and validation

`RegistrationFields.tsx` renders text, email, telephone, number, date, select,
checkbox, address and file controls from `fields`. Labels/options are backend
content. Verified email is read-only. Numeric answers remain strings; selects
preserve the exact option text; required checkboxes must be true.

The client enforces required values, lengths, digit counts, numeric limits and
patterns; server `patternMessage` is shown unchanged. Date keys containing
`expiry` or `expires_on` cannot be in the past. Ordinary dates allow past dates.
Address answers require line1, city and an uppercase ISO alpha-2 country; postcode
stays text. Unknown field types fail closed instead of being silently submitted.

Validation runs on Continue and final submit. Editing an answer immediately clears
that field's previous validation error, including dates, selections, addresses and
successful uploads. Vehicle edits clear only changed fields/document errors;
untouched errors remain visible. Invalid or cleared values are checked again on
the next Continue, so hiding a stale error never bypasses submission validation.

Only enabled schema keys cross the submit boundary, excluding phone/mobile and
telephone fields, which are handled by Module 2's dedicated phone endpoint.
First/last name and agreement from the preserved entry screens prefill matching enabled keys when the
server has no value. They are not injected if the workspace omits them. No live
workspace schema has been inspected yet.

## Uploaded documents

Each file uploads first to `POST /v1/driver-registration/files` with
`X-Driver-Invitation` and the supported MIME as Content-Type. The service sends raw
bytes, not multipart. Accepted types: JPEG, PNG, WebP and PDF; maximum five MB.
The server enforces ownership, actual file bytes and the 100-upload/application
limit. A successful returned filename becomes the answer; local URIs are not
submitted as filenames and files are never marked externally verified by the UI.

`RegistrationFileField.tsx` supports replace/remove, pending/error feedback,
expiry dates and existing uploaded names. Required expiry dates must be today or
later. Existing optional expiry values (such as RC) can also be corrected.
Failed uploads do not overwrite a previous successful file answer.

Android camera/gallery uses installed image-crop-picker and compresses photos to
roughly 1600px at 0.7 quality before upload. The document picker handles files.
iOS currently offers the document picker only because camera/photo permission
descriptions are not configured; this task does not add native permissions.
Cancellation preserves the existing answer. Repeated taps and submit during an
upload are blocked. The raw transport rechecks Blob size before sending.

## Own vehicle branch

`vehicle-options` returns the workspace's active types, brands and models.
`RegistrationVehicle.tsx` filters type → brand → model and clears dependent
selections when an upstream choice changes. Fuel is optional and hidden when the
selected model has no fuel choices. Labels come from the catalog; the app does
not assume the previous preview's Car/Bike-only catalog.

The allowlisted vehicle payload contains only:

- `model_id`, optional valid `fuel_type_id`.
- Integer year 1980 through next year.
- Uppercase registration number, 2–20 characters; colour, 1–40 characters.
- Required registration certificate, with optional valid expiry.
- Required insurance, with expiry.
- Optional pollution certificate, with expiry whenever supplied.

Brand/type are inferred by the server from the model and are not extra payload
keys. Fleet submissions omit `vehicle` entirely, even if a prior local Own draft
exists. Catalog changes make invalid saved selections fail validation.

## Drafts, corrections and state

`registrationStore.ts` owns one workspace/origin-scoped AsyncStorage draft:
application identity, email, answers, drive mode, vehicle and display status.
There is no draft-save API. Tokens live only in Keychain; passwords/OTP never
enter this draft. Files already uploaded remain application-owned on the server.

Draft reuse requires the same application/email and server baseline. Changes to
schema version/fields, server answers, vehicle, correction reason or drive mode
replace a stale local baseline with the current server form. Reinstallation can
recover server-held answers/files, but unsent local-only changes are not promised
after app removal. Storage failures are visible and do not pretend a crash-safe
save succeeded.

Submit revalidates personal and vehicle values, builds an allowlisted payload,
and waits for `pending_review`. The app saves terminal display state, removes the
consumed registration token and opens `RegistrationStatusScreen`. Terminal local
state discards form/vehicle drafts. 401/409 returns to fresh email verification;
429 blocks actions using the server retry deadline. A failed submission does not
navigate to success or issue a login session.

## Code boundaries

- `interface/driverRegistration.type.ts`: shared API/schema/draft types.
- `service/config.ts`: centralized registration/auth endpoints.
- `service/rest/auth.ts`, `registrationResponse.ts`, `driverClient.ts`: auth API
  functions, schema validation and Axios transport via shared helpers. Raw
  responses are validated before reaching the UI; `driverRegistration.ts` remains
  a compatibility export.
- `hooks/useDriverRegistration.ts`: loading, steps, errors and submission.
- `store/registrationStore.ts`, `service/registrationEntry.ts`: non-secret drafts
  and entry-prefill candidates. `service/driverSession.ts`: secure credentials.
- `components/driverOnboarding/RegistrationFields.tsx`,
  `RegistrationFileField.tsx`, `RegistrationVehicle.tsx`: existing themed controls.
- `utils/registrationValidation.ts`, `registrationVehicle.ts`: validation and
  submit allowlists. `OnboardingLayout` supplies background/scroll/footer behavior.

English/Hindi/Spanish app copy, safe areas, text scaling and existing Light/Dark
palettes remain supported. API labels and user-entered values are not translated
as resource keys. Logs contain event/error codes only, not profile/document data.

## Retained preview screens and unavailable fields

The previous `DrivingPreferenceScreen`, `EarningLocationScreen`,
`ChooseVehicleTypeScreen`, `ProfileScreen`, individual document/model screens and
`BankDetailsScreen` are preserved but are not the active API registration path.
Their `driverOnboardingStore`, local-completed flags, 10-MB limit and old year/bank
validation describe the inactive preview only. They must not override the active
API's five-MB limit, schema or submission requirements.

The user requested preserving product fields/screens. City, referral and bank
fields need an enabled workspace form schema or an explicit backend endpoint/
payload. They are not currently hard-coded into API submission, and no bank
verification is claimed. The signup password screen is retained in Module 2 but
cannot create a credential until the backend supports that registration action.

Legacy Menu document/vehicle preview sources are separate from this integration;
authenticated document downloads and live profile/vehicle retrieval need their
own driver endpoints. This change does not claim that uploading registration
papers populates every Menu screen with verified backend data.

## Verification

Stale-field-error fix (2026-11-19): regression coverage verifies error clearing
for text/date/email/number/select/checkbox/address/file answers, untouched-error
preservation, vehicle/document edits, and revalidation on Continue. Full
`yarn test --runInBand`: 336 passed, 8 previously documented failures across
logout/shared-UI/biometric suites. `yarn type-check` still reports only the two
existing TextArea/CardImageComponent errors; `yarn lint` still lacks config.
This fix has no fresh native interaction verification.

Focused mocked tests cover dynamic validation, raw uploads and cancellation,
vehicle cascade/date/catalog constraints, token consumption, fleet/own payloads,
401/409 recovery, 429 cooldown, draft persistence and stale-admin-revision reset.
Final focused run: 138/138 pass across 13 auth/registration/menu suites. Full
regression: 311 pass, 8 existing legacy logout/shared-UI/biometric failures.
`yarn type-check` has the existing
TextArea/CardImageComponent issues; `yarn lint` lacks repository configuration.

Android emulator auth entry was inspected; the backend returned 401 to an
unauthenticated driver/me probe. No approved test email/account was available,
so real registration uploads, submit, approval/corrections and activated login
remain unverified. Physical device and iOS account flows were not exercised.
The historical `/private/tmp/uniride-onboarding-*.png` captures belong to the old
preview and are not evidence of this API integration.

Device setup/build/recovery remains in [shared setup](starter-setup.md).
