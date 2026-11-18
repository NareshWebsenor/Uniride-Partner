# Module 4 — Home aur Bottom Tabs

Status: navigation active; Trips, Earnings aur Inbox header-only screens hain.
Menu mein reference-based profile/settings UI aur working appearance/language controls hain.
Notifications ke neeche saved app-wide [Text Size (Module 4)](text-size.md) active hai.
Backend data, trips, payouts aur messaging is module mein implement nahi hue hain.

## Flow

Module 2 login preview / Module 3 onboarding completion → `MainStack` → Home.
Bottom bar ka order: Home, Trips, Earnings, Inbox, Menu. Home initial selection hai;
Android back kisi doosre tab se Home par laata hai. Splash, auth, onboarding aur
root Settings screen par bar nahi dikhta. Home ka App settings button removed hai;
appearance/language ab Menu ke direct controls se change hote hain.

## Implementation aur decisions

- `src/navigations/MainTabs.tsx`: installed React Navigation bottom-tabs reuse;
  typed routes `src/interface/navigation.type.ts` mein hain. Existing `MainStack`
  root route ID retained hai, isliye auth/onboarding callers change nahi hote.
- `src/components/ui/BottomTabBar.tsx`: reference ke outline icons, blue selection,
  pale rounded icon highlight aur equal-width tabs. Existing legacy `BottomTab`
  import canonical component ko re-export karta hai; uska koi active caller nahi tha.
- `src/assets/svg/MainTabIcon.tsx`: vector icons installed SVG library se render hote hain.
- Home/Trips/Earnings/Inbox `ScreenWrapper` aur translated heading use karte hain.
  Menu `AppBackground` aur scrollable grouped cards use karta hai.
- Bar bottom inset own karta hai; screen layout bottom inset zero karta hai.
  Screen ke top/left/right safe areas AppBackground handle karta hai.
- Colors central palette se aate hain; `tabActiveBackground` aur `tabInactive`
  dono themes mein defined hain. Labels English/Hindi resources se reactive hain.
- Tab presses preventable hain; long-press events aur selected accessibility state
  supported hain. Touch targets minimum 48dp; labels wrap aur font scaling allowed hai.
- Icon container clipping aur native view retention Android par selection badalne
  ke baad bhi rounded highlight preserve karte hain.
- Dev-only selection log sirf internal route ID record karta hai. Tab navigation
  mein nayi dependency, native setting ya API call nahi hai.

## Menu profile aur preferences

- `src/screens/main/tab/MenuScreen.tsx` composition own karta hai;
  `src/screens/main/menu/` mein profile, rows/sections aur preference controls hain.
- Reference ka name, rating, verified badge aur vehicle **demo data** hain. Avatar
  themed person-icon fallback hai; original portrait asset supplied nahi hai.
- Screenshot ke Account, Preferences, Help & safety, Log out aur legal rows present
  hain. Documents, vehicle, sound, notifications, help, safety, logout aur legal
  actions translated Coming soon modal kholte hain; backend/OS changes nahi karte.
  Classic/On reference preview labels hain, live sound/permission status nahi.
- Dark mode switch resolved theme dikhata hai; toggle explicit Light/Dark save karta
  hai. Dark mode label tap se Light/Dark/System selector khulta hai. System option
  existing OS-follow behavior preserve karta hai.
- App language opens English/Hindi selector. Both controls reuse existing stores;
  no duplicate preference state or storage. Save failures visible hain; selection
  modals back/backdrop/close se dismiss hote hain. Existing Settings route retained
  hai for compatibility, Menu mein extra App settings row nahi hai.
- App-authored text English/Hindi resources mein hai; rows wrap, scroll aur font
  scaling support karte hain. Dev logs only internal action keys record karte hain.

## Verification

- Menu update: focused Menu/tab/starter/theme/language suites **31/31 pass**.
  Covers actual controls, saved dark/system/Hindi values, save failure, unavailable
  actions, modal dismissal and Home settings-button removal.
- Menu update: UI color/translation guard passes; type-check retains only existing
  TextArea and CardImageComponent errors. Existing missing ESLint config unchanged.
- Android emulator: Menu Light/Dark layouts, direct switch, Hindi selector and
  Android-back modal dismissal visually verified. Portrait remains a themed avatar
  fallback; footer scrolls on smaller displays. Physical device/iOS checks pending.
- Menu full regression: 65 passed / same 8 pre-existing failures across biometric,
  legacy logout and shared UI suites. No new failures; open-handle warning remains.

- `yarn test --runInBand __tests__/main-tabs.test.tsx`: five routes, matching headings,
  initial Home, back-to-Home, prevented press, long press, live Hindi/English aur
  Light/Dark updates covered hain.
- Shared theme/language persistence existing store tests own karte hain.
- Android emulator: latest Metro bundle se preview login → Home, Earnings/Menu
  headings, selected icon pill aur system Light/Dark appearance visually verified.
  System Light restore kiya gaya; native rebuild required nahi tha.
- Final focused tab tests: 2/2 pass. Full suite: 62 pass / wahi 8 baseline failures
  (biometric gate/service, legacy logout aur shared UI assertions); baseline 60/8 tha.
  Existing Jest open-handle warning retained hai.
- `yarn check:ui` aur `git diff --check` pass. `yarn type-check` mein wahi baseline
  TextArea/CardImageComponent errors hain; `yarn lint` missing ESLint config se blocked hai.
- Physical device aur iOS visual checks pending hain.
