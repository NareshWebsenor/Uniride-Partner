# Module 4 — Home aur Bottom Tabs: Text Size

Status: active. Menu → Preferences → Notifications ke immediately neeche **Text
size** row hai. Row dedicated root `TextSizeScreen` kholta hai; back se same Menu
tab par wapas aate hain. Is screen par bottom bar nahi hai.
Header/back control fixed hai; preview aur options separately scroll karte hain.

## Behavior

- Four choices: Small 85%, Default 100%, Large 115%, Extra large 130%.
- Selecting a radio option changes only the “Hello! I'm waiting near the pickup
  point” message. Heading, paragraph, controls and all other app text keep the
  currently applied size. Selection is a screen-local draft, never persisted.
- A different selection shows **Apply**. Apply updates the app through the existing
  store and saves the choice; button returns to **Reset to default**. Selecting
  another option repeats preview → Apply. Selecting the applied value cancels the
  pending change. Back discards the unapplied draft.
- Reset immediately applies/persists Default and updates the selected radio/message.
  Reset is disabled when Default is already applied. While saving, choices and the
  action are disabled. Failed save keeps the applied session size and shows an
  error plus Apply for retry; it does not claim the preference was saved.
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
- `TextSizeScreen` compensates the message's base font by draft-scale/applied-scale,
  so the shared renderer previews the absolute selected size exactly once. It does
  not change global typography or add a second preference owner.
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

- `yarn test --runInBand __tests__/text-size-ui.test.tsx
  __tests__/text-size-store.test.ts __tests__/menu-screen.test.tsx`: **26/26 pass**.
  Covers message-only preview, unchanged global state/storage before Apply,
  repeat selection after Apply without double scaling, draft discard, Hindi,
  Reset, save failure/retry and disabled controls during persistence.
- Existing tests also cover native text/input styles, nested text, retained input
  drafts, buttons/modals, corrupt storage, hydration and ordered writes.
- `yarn check:ui` and `git diff --check` pass. Type-check retains the existing
  TextArea/CardImageComponent errors; no native/dependency change.
- Earlier store integration was verified on Android for cold-restart persistence.
  Android emulator verified Small → draft Extra large (only message changes) →
  Apply (global resize/Reset button) → Reset (Default). Heading bounds stayed
  identical during draft preview. Evidence: `/private/tmp/uniride-text-size-draft.png`
  and `/private/tmp/uniride-text-size-applied.png`. Original Small preference restored.
  Physical device/iOS and unusually large combined OS/app scales remain unverified.
