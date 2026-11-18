# Module 3 — Driver Onboarding

[Module index](starter-setup.md) · [Module 2 — Auth Flow](auth-flow.md)

## Scope aur flow

Ye UI preview module hai. Auth registration ke terms complete hone par draft reset
hota hai aur registration ka first name welcome heading mein use hota hai.
Login abhi Home kholta hai. Real account/session, document verification, bank
verification ya backend submission is change ka part nahi hain.

Registration → accept Terms and Continue → Driving Preference (Fleet/Own).

- Fleet Partner → Profile (driver) → Submit Application → preview confirmation → Home.
- Own Vehicle → Earning Location (city/referral) → Choose Vehicle Type (Car/Bike) →
  Profile (driver, stage 1) → Profile (vehicle, stage 2) →
  Bank Details (stage 3) → preview confirmation → Home.
- Driver stage: Driving License, Profile Picture, Government ID.
- Vehicle stage: Vehicle Model, Vehicle RC, Pollution Certificate, Vehicle Insurance.
- Every row opens its named screen; Submit validates and returns to the checklist.
  Checklist Continue is disabled until the required items are completed.
- Native back navigation retains draft data. Stage 2 is pushed as a separate
  Profile route so Back returns to stage 1. City Back returns to Fleet/Own;
  vehicle-type Back returns to city. Fleet/Own screen Back opens auth.

## Screen aur component names

`src/screens/driverOnboarding/` contains:

- `EarningLocationScreen`, `ChooseVehicleTypeScreen`, `DrivingPreferenceScreen`.
- `ProfileScreen` with typed `stage: driver | vehicle` route parameter.
- `DrivingLicenseScreen`, `ProfilePictureScreen`, `GovernmentIdScreen`.
- `VehicleModelScreen`, `VehicleRcScreen`, `PollutionCertificateScreen`,
  `VehicleInsuranceScreen`, `BankDetailsScreen`.

Root navigation registers each screen with the same route name. Document screens
compose `OnboardingDocumentForm`; a shared form keeps upload/error behavior aligned
without duplicating six implementations. `OnboardingLayout` provides AppBackground,
safe areas, Help, scrollable content, fixed footer and keyboard-controller avoidance.
Continue/Submit stays at the screen bottom outside keyboard avoidance on all twelve
onboarding screens. The open keyboard covers the footer; dismissing it reveals the
button at its original position. Only the form area adjusts for the keyboard.
`OnboardingChoiceCard`, `OnboardingProgress`, `UploadField`, `OnboardingDateField`
are shared module components. Canonical `components/ui` Button, Text and TextInput
remain the underlying controls.

## Data aur validation

`src/interface/driverOnboarding.type.ts` owns shared props, route and draft types.
`src/store/driverOnboardingStore.ts` owns one memory-only draft. It contains the
chosen city/referral/type/preference, six document drafts, vehicle and bank fields.
No AsyncStorage, persisted files, auth tokens or API requests are added.

`src/utils/driverOnboarding.ts` validates:

- Own branch: city required; referral optional. City is free text, with Nassau as example.
  No supported-city list, geocoding or eligibility claim exists yet.
- Fleet/Own preference requires explicit selection. Vehicle type is required only
  for Own; Fleet skips city/referral and vehicle type entirely.
- License, Government ID and RC require front/back plus document number.
- Profile Picture requires one image. Other documents allow images/PDF.
- Local files must have known positive size, supported MIME type and size ≤10 MB.
- Pollution requires certificate number and valid-until date. Insurance also
  requires provider/company. Dates use local `YYYY-MM-DD`; invalid or past dates fail.
- Vehicle make/model/variant required; manufacture year must be four digits,
  between 1900 and the current year.
- Bank name, holder, account number, confirmation and IBAN required. Account
  numbers must match after trimming. IBAN is deliberately required-only, per
  product direction; this is not a Bahamas banking-format or payment validation rule.
- Editing/removing a submitted document invalidates its Completed state.
  Editing vehicle fields does the same. Changing car/bike clears vehicle-specific
  fields/documents while retaining driver documents.
- Final eligibility is checked again at confirmation. Fleet requires only driver
  documents; city, vehicle type, vehicle documents and bank are excluded. Own
  requires city, vehicle type and all three stages. Finish clears bank fields and retains documents/vehicle in memory for
  [Module 4 — Menu Details](menu-details.md). Logout clears the entire draft.

Completed means locally filled and submitted to the checklist, not externally
verified. Final confirmation explicitly says no documents/application were sent online.
Preview drafts disappear on process restart. Registration start clears previous data.
No document numbers, bank details, paths, names or raw errors are logged.

## Uploads, theme aur assets

Installed `@react-native-documents/picker` opens the system file chooser in temporary
open mode. Selection cancellation keeps the draft unchanged; invalid files and
picker failures show translated feedback. Repeated taps cannot open multiple pickers.
Images preview inline; PDFs show their filename. Selection can be replaced/removed.
No file copies or long-term URI permissions are requested. The UI says choose a
photo/file; camera capture is not added. Native camera permissions remain unchanged.

Installed `react-native-modal-datetime-picker` supplies calendar selection. No
new dependency or native build configuration is introduced.

All colors use the existing `theme.utils.ts` palette through reactive hooks. Light
uses white surfaces and blue actions; Dark retains dark surfaces. System is the
default and follows the phone; explicit app Light/Dark choices persist across
restarts and OS changes. Layout uses `wp`, `hp`, `fSize`, scalable text,
minimum touch targets, scrolling and AppBackground on every screen. Status-bar icons
use actual background brightness (including native-stack options), keeping both
palettes readable across navigation and file-picker return.

`rider.png` is used for Fleet Partner; `driver.png` for Own Vehicle. Source images
are unchanged. Vehicle choices use generated transparent `commercial-car.png`
and `scooter.png` artwork, positioned top-right to match the supplied vehicle-card
reference. Compact person/car badges, outlined selection, and descriptions follow
that reference while colors remain theme-driven. These generated vehicles are
reference-inspired, not the original design exports. All copy exists in English
and Hindi.

## Verification

Focused tests cover branch gating, registration handoff, draft invalidation/reset,
document/date/file validation, account confirmation, picker cancellation/errors,
repeat taps and reactive language/theme rendering. Native validation evidence and
repository baseline failures:

- Focused command: `yarn test --runInBand --watchman=false` with
  `driver-onboarding-state`, `driver-onboarding-ui`, `driver-onboarding-fields`,
  `partner-auth`, `starter-flow` test files: **33 tests passed** after the
  preference-first flow change. Covers Terms handoff, Fleet without city/type,
  Own routing and required fields, and city/preference Back actions.
- Earlier full-suite run (before status-bar adjustments): **56 passed, 8 failed**.
  The same pre-existing failures remain: auth logout timeout (1), biometric service
  (2), biometric gate (2), loading button/settings/toast tests (3).
- `yarn type-check`: only the existing TextArea nullable `maxLength` and
  CardImageComponent ViewStyle/ImageStyle errors. No new module type errors.
- `yarn check:ui` and `git diff --check`: passed.
- `yarn lint`: blocked by the repository's missing ESLint configuration.
- Earlier Android emulator checks (before the preference-first reorder;
  reordered journey has component/state coverage, not a fresh device run): registration handoff,
  city input/keyboard footer, both supplied image choices, Fleet checklist,
  Own stage-one progress, license/profile forms, system file chooser, local PNG
  preview and chooser cancellation were exercised. Status icons remained visible
  after the native navigation integration fix. Real vehicle/bank completion is
  covered by component/state tests; no actual application was submitted.
- Physical device unavailable; iOS and native calendar interaction not exercised.
  No native code/dependency changes; no new native rebuild was needed.
- Metro briefly disconnected during file selection; existing server was reused
  and `adb reverse tcp:8081 tcp:8081` restored. The local selection still completed.

Screenshots from this session are in `/private/tmp/uniride-onboarding-*.png`;
these are local verification artifacts, not bundled product assets.

## Backend handoff

Future integration needs supported cities, file-upload contract, document and bank
schemas, application/status endpoints, authentication and draft-resume policy.
Screens must continue to call service/store boundaries rather than HTTP directly.
The screenshot's pollution certificate and IBAN labels remain preview requirements;
jurisdiction-specific requirements need the product/backend contract before rollout.
Device setup/build/recovery remains in [shared setup](starter-setup.md).
