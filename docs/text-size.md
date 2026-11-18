# Module 4 — Home aur Bottom Tabs: Text Size

Status: active. Menu → Preferences → Notifications ke immediately neeche **Text
size** row hai. Row dedicated root `TextSizeScreen` kholta hai; back se same Menu
tab par wapas aate hain. Is screen par bottom bar nahi hai.
Header/back control fixed hai; preview aur options separately scroll karte hain.

## Behavior

- Four choices: Small 85%, Default 100%, Large 115%, Extra large 130%.
- Preview heading, paragraph aur sample message selection ke saath live resize hote
  hain. Choice immediately poore app par apply hoti hai; separate Save button nahi.
- Reset to default aur failed save par Retry available hain. Pending writes ke
  dauran Saving status; failure par selection current session mein visible rehti hai,
  lekin next launch ke liye saved claim nahi hota.
- English/Hindi labels, light/dark palettes, font wrapping aur scrolling supported.
- Device accessibility font scaling additional rehti hai. App preference OS setting
  ko modify nahi karti. Native system dialogs, keyboard, pickers aur text embedded
  in images OS/assets ke control mein rehte hain.

## Single owner aur rendering

- `src/store/textSizeStore.ts`: Zustand preference, hydration, saving/error state.
  AsyncStorage key `text-size-preference`: `{ "version": 1, "size": "default" }`.
  Only named choice persist hoti hai; computed font sizes nahi.
- Writes serialized hain; revision guard stale failures/hydration ko latest user
  selection overwrite nahi karne deta. Missing preference safe default hai;
  corrupt/unsupported/read failures default + recoverable error produce karte hain.
- `App.tsx` theme/language/text-size hydration complete hone par navigation mount
  karta hai. Settings apply karne se navigation/form remount nahi hota.
- `src/components/ui/Typography.tsx` final native text/input boundary par `fontSize`,
  explicit `lineHeight` aur `letterSpacing` multiply karta hai. Existing static
  StyleSheet values aur caller overrides isliye immediately update hote hain.
  Nested text bina explicit size parent ko inherit karta hai; double scaling nahi.
- Shared Text/Heading/TextInput aur existing direct native text/input consumers
  ye boundary use karte hain: auth, onboarding, tabs, menus, buttons, errors,
  sheets, modals, toasts aur retained legacy components. Input refs/values preserved.
- `fSize`, wp/hp, icons, assets aur container spacing unchanged hain. Scaling ko
  fSize mein add karna static styles ko stale rakhta aur icon sizes bhi badalta;
  isi liye render boundary chosen hai. Native unstyled text ka 14sp default retained.
- `scripts/check-ui-rules.cjs` Typography ke bahar direct runtime RN Text/TextInput
  imports reject karta hai, taaki future UI text preference bypass na kare.
- Safe dev logs only preference event codes record karte hain. Nayi dependency,
  permission, native build setting ya API call nahi hai.

## Verification

- Store tests cover all saved choices, concurrent hydration, malformed/unsupported
  storage, failed reads/writes, queued rapid choices, stale failures and retry.
- UI tests cover final style overrides, line height, nested text, inputs retaining
  their draft, buttons, already-visible modals, live preview, Hindi and reset.
- Menu test verifies row order and destination; App test waits specifically for
  persisted text-size hydration before rendering navigation.
- Focused store/UI/Menu/tab/App checks: 26 pass; fixed-header follow-up UI/App
  checks: 4 pass. Full suite: 85 pass, same 8 baseline failures (biometric gate,
  biometric service, legacy logout and shared UI assertions); existing open-handle
  warning remains.
- Android emulator: Notifications → Text size placement, default/130% live preview,
  fixed back header, return to selected Menu, resized Menu/tab labels and cold app
  restart into login with saved 130% size visually verified. Default restored after
  checking. Input draft retention and Hindi/reset covered in UI tests.
- `yarn check:ui` and `git diff --check` pass. Type-check retains the existing
  TextArea null numberOfLines and CardImageComponent style errors. ESLint config
  remains missing from baseline; no native files/dependencies changed.
- Physical device/iOS aur unusually large combined OS/app font scales need device
  coverage; native system UI follows OS text settings.
