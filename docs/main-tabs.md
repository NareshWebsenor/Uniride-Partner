# Module 4 — Home aur Bottom Tabs

Status: navigation active; Trips, Earnings aur Inbox header-only screens hain.
Home now includes [Module 4 — Home Ride Preview](home-rides.md): Offline/Online,
timed requests, Arriving and OTP/Start Trip with demo data.
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
- Trips/Earnings/Inbox `ScreenWrapper` aur translated heading use karte hain.
  Home `AppBackground`, themed map layer and scrollable state-specific panels uses.
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
- Reference ka name, rating aur profile verified badge **demo data** hain. Avatar
  themed fallback hai. Vehicle identity actual onboarding selection se aati hai.
- Documents, vehicle, language, sound, notifications, Help/Safety root-stack screens
  open karte hain; in screens par tab bar hidden hai. Logout bottom sheet confirm
  par local preview data clear karke Login reset karta hai.
- Dark mode switch aur Light/Dark/System modal existing store reuse karte hain.
  App language ab dedicated English/Hindi/Spanish screen par Save ke baad apply hoti hai.
- Backend-dependent support/contact/trip actions aur legal links Coming soon modal
  dikhate hain. Sound/notification choices saved device preferences hain; live push
  integration inactive hai. Details: [Module 4 — Menu Details](menu-details.md).
- Text-size row Notifications ke neeche retained hai; screen settings, sheets aur
  labels shared scaled typography se update hote hain.

## Verification

- Main tab tests cover initial Home, five routes, back-to-Home, prevented press,
  long press and live theme/language updates. Text size has its own store/UI tests.
- Menu detail update: full suite **114 pass / 8 existing failures** in legacy
  logout, biometric gate/service and shared UI assertions. Final Menu/tab focused
  checks **23/23 pass** after themed-alert/modal-safe-area changes.
- UI guard and diff check pass; two baseline TypeScript errors and missing ESLint
  config remain. Exact coverage/limitations in [Module 4 — Menu Details](menu-details.md).
- Android emulator verifies light/dark, Hindi, font scaling, navigation, saved
  preferences and logout. Physical device and iOS visual checks pending.
