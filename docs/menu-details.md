# Module 4 — Menu Details

Parent: [Module 4 — Home aur Bottom Tabs](main-tabs.md). Active UI/local preferences;
auth, document verification, push delivery aur support backend abhi preview/deferred hain.

## Flow aur data

- Menu → My documents: driving licence/Government ID, actual selected files ka count,
  upload state aur View. Empty documents existing onboarding form open karte hain.
- Menu → Vehicle details: committed make/model/variant/year/type aur RC number.
  No vehicle (Fleet included) par sirf translated, themed add-vehicle alert.
  RC/insurance/PUC cards existing forms se Upload/Update hote hain. Expiry selected
  local calendar date se calculate hoti hai; <=30 days par expiring badge.
- View → DocumentViewerScreen: actual front/back images; PDF external viewer ko
  local URI pass karta hai. Viewer/file unavailable ho toh recoverable error;
  image read failure bhi visible hai. No fake document image or Verified status.
- Uploaded means locally completed selection, server acceptance nahi. Pending
  verification note visible hai. Fuel/colour/seating backend fields absent hain;
  screenshot ka demo data invent nahi kiya gaya.
- `driverOnboardingStore.completePreview()` completion validate karta hai, bank
  fields clear karta hai aur docs/vehicle memory mein retain karta hai. Restart,
  logout ya new registration par local draft disappear hota hai. No document,
  bank detail or profile persistence introduced. One draft owns many documents;
  document has optional front/back local upload. No database schema change.

## Preferences

- App language: English/Hindi/Spanish draft selection → Save → existing languageStore.
  Back discards unsaved selection; error keeps screen open for retry.
  Spanish is bundled as `es/translation.json`, with the same key/placeholder
  contract as English. Selector autonym is Español; languageStore saves `"es"`
  using the existing LANGUAGE key. App startup restores it before rendering.
  English remains fallback; onboarding date display uses Spanish locale.
- Order sound: four original bundled WAV previews (Classic/Chime/Bell/Pulse),
  vibration draft, Save persists and returns. Back discards draft. Single player
  ends/stops on blur, background, audio focus loss, headphones removal or unmount.
- `notificationPreferencesStore` owns sound, vibrate and notificationsEnabled.
  Versioned AsyncStorage `notification-preferences`, safe defaults, validated
  hydration, serial writes, save failure preserves last saved state. Startup waits
  for hydration. Logs contain only safe event codes.
- Notifications On/Off saves immediately, failed write shows Retry. These settings
  currently store app intent; they do not request OS permission or control server
  pushes. Dormant legacy notification utility remains disconnected. Future order
  delivery must consume this store and configure native channels/sounds as needed.
- No new dependency or native permission. Tone generation source is
  `scripts/generate-alert-tones.py`; playback reuses installed react-native-video.
- Dark/Light/System and [Module 4 — Text Size](text-size.md) behavior retained.
- Shared `Switch` in `src/components/ui/SelectionControls.tsx` now draws the
  screenshot-style pill and white thumb, so vibration, theme and biometric
  preferences use one consistent control on Android/iOS. `toggleActive` and
  `toggleInactive` live in both central theme palettes. Existing controlled value,
  disabled state, translated accessibility label and minimum 48dp touch target
  remain; selection persistence stays with the consuming screen/store.

## Help, Safety aur logout

- Help search filters translated topics/FAQ; empty results visible. FAQ opens its
  answer. Support, requests and topic service actions show Coming soon.
- Safety uses product-requested `123` with `tel:` system dialer, no automatic call
  or claim about country/provider. Missing phone app shows an error. Contact add,
  support and trip-share services are pending; safety tips opens local copy.
- Logout sheet: red confirmation + Cancel; backdrop, Android Back and accessibility
  escape dismiss. Confirm clears current preview draft and resets to Login, so
  Back cannot reopen Menu. Display/alert preferences survive logout. Active auth
  creates no remote session; deferred legacy session logout is not called.
- Shared Modal measures its own native safe area: tab content intentionally owns
  zero bottom inset, but a bottom sheet needs the actual modal-window inset.

## Implementation

`src/screens/main/menu/` composes shared MenuDetailLayout, cards/rows and screens.
Routes are typed in `navigation.type.ts` and registered in `Application.tsx`.
`MenuScreen` owns navigation/vehicle guard/logout sheet; MenuPreferences shows live
saved values. Shared components, semantic theme colors, English/Hindi/Spanish translation
keys and scaled typography avoid duplicate presentation/preferences systems.

## Verification

- Spanish/custom-toggle follow-up: **32/32** existing Menu/alert/language/resource
  tests passed; text-size UI **5/5** passed after correcting its async test callback
  return type. UI rule guard and diff whitespace check pass. Type-check retains
  only the two baseline errors below.
- Spanish resource parity covers all **844** English keys, nonempty values,
  interpolation and rich-text tags. Last full suite before the toggle styling
  change: **122 passed / 8 existing failures**. Emulator verified three language
  options, Spanish Menu and Spanish restoration after cold restart.
- Custom toggle On/Off and theme switching inspected on Android emulator with
  existing Metro; screenshots `/private/tmp/custom-toggle-on.png`,
  `/private/tmp/custom-toggle-off.png`, `/private/tmp/custom-toggle-dark.png`.
  Unsaved vibration choice discarded on Back; original English/Light restored.
  Physical device and iOS rendering remain unverified.
- Full Jest suite: **114 passed / 8 existing failures**, 20 suites. Existing failures
  remain in legacy logout, biometric gate/service and shared UI assertions.
- Final focused Menu/tab tests after themed-alert/modal-safe-area change: **23/23**.
  Preference store tests: **12/12**. Document/onboarding tests: **21/21**.
- `yarn type-check`: same two baseline TextArea/CardImageComponent type errors.
  `yarn lint`: existing missing ESLint configuration. `yarn check:ui` and
  `git diff --check` pass.
- Android emulator (physical device unavailable), existing Metro reused; no native
  rebuild required. Layout captures: `/private/tmp/uniride-menu-*.png`.
  My documents empty state, missing vehicle, language, sound, notifications,
  Help/Safety and logout sheet visually inspected. Hindi/Dark at 130% text size
  checked on sound screen; saved Chime/Off plus Hindi/Dark survive a cold restart.
  Logout Cancel preserves Menu; confirm resets to Login. Test preferences restored
  to English/Light/Default/Classic/On. iOS and physical audio quality unverified.
  Actual document/vehicle data paths are covered by Jest; native uploaded-file/PDF
  viewer integration still needs device validation with real documents.

## Pending integration

Real auth/session, persistent server documents/verification, real assigned Fleet
vehicle, push/order delivery, emergency contacts, support requests, trip sharing
and legal destinations need their respective services. User approved Coming soon
for unavailable services; no unresolved UI product choice remains.
