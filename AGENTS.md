# BOSS — UniRide project rules

Ye rules sirf is repository aur iske subdirectories par apply hote hain.
Global agent settings, global skills ya doosre projects ko modify mat karo.
Repo folder UniRide hai; existing registered app identity BharatTalk hai.

## Communication aur scope

- Har user-facing message `BOSS` se shuru; concise Hindi Latin script use karo.
- Pehle existing files aur user intent inspect karo; assumptions clear rakho.
- Architecture, API, data model, native identity aur UI flow decisions se pehle
  problem, approach, affected files aur tradeoffs share karke input lo.
- Implementation request ho to approved work complete karo; sirf proposal mat do.
- Existing unrelated errors ko bina requested scope ke bulk-fix mat karo.
- Existing files ko inspect kiye bina replace/delete mat karo.
- Destructive work, signing/release changes aur unrelated native changes ke liye
  explicit approval zaroori hai.
- Large explanations mein concise lists ya readable ASCII tables use karo
  (maximum five columns).
- Plans mein changed files/groups aur unresolved questions do. New architecture
  planning mein 3–10 concrete questions, recommended answers aur examples do;
  repo inspection se answer milta ho to user se repeat mat pucho.

## Project architecture

- React Native CLI + TypeScript; Expo aur Expo dependencies mat add karo.
- Existing modules extend karo; duplicate implementations ya placeholder folders
  sirf structure dikhane ke liye mat banao.
- `src/screens`: screen composition aur navigation interaction.
- `src/components/ui`: reusable public UI API; legacy components adapters hain.
- `src/layouts`: screen/container layout; domain layouts existing
  `src/components/layouts` mein hain.
- `src/navigations`: typed navigators; `src/hooks`: reusable hooks.
- `src/service/rest`: existing API client aur endpoint services;
  `src/service/socket`: realtime transport. UI mein HTTP/socket calls mat likho.
- `src/store`: Zustand state. Theme/language ka single owner yahi hai.
  Legacy Redux modules ko same preference ke second source mein mat badlo.
- `src/constants`, `src/utils`, `src/interface`: constants, pure utilities,
  shared types. Existing type paths ko preserve karo.
- `src/theme`: theme colors, design tokens, native/navigation integration.
- `src/localizations`: i18n setup, `en/translation.json`, `hi/translation.json`.
- `src/assets`: existing images, fonts, audio, video aur theme-aware SVG assets.
- Har file single responsibility rakhe; ideally <300 lines, >500 sirf documented
  necessity par. Existing large files ko unrelated task mein rewrite mat karo.
- Proper interfaces/unions use karo; new `any`, unsafe assertions aur duplicated
  state avoid karo. Memoization sirf useful dependency/re-render boundary par.
- New dependencies add karne se pehle installed alternatives aur compatibility
  check karo aur reason share karo.

## Mandatory theme rules

- UI ke saare colors `src/theme/colors.ts` mein centralized hon.
- Components, screens, layouts, navigation, SVGs aur styles mein hex, rgb/rgba,
  hsl, named colors ya transparent color literals mat likho.
- `useTheme()`, `useThemeColor()` ya `useThemedStyles()` use karo.
  Render mein `useThemeStore.getState()` snapshot se colors mat lo.
- Semantic tokens use karo: `background`, `surface`, `surfaceRaised`,
  `textPrimary`, `textSecondary`, `border`, `primary`, `onPrimary`,
  `success`, `warning`, `error`, `disabled`, `overlay`, `transparent`, `shadow`.
- Legacy palette aliases existing callers ke compatibility ke liye hain;
  new UI semantic tokens use kare.
- Light aur Dark mein same token contract mandatory. Brand changes centralized
  palette mein karo; per-screen palette ya second provider mat banao.
- `src/theme/tokens.ts` se spacing, typography, radius aur sizes lo.
- `src/store/themeStore.ts` theme preference ka single owner hai:
  `light | dark | system`; resolved palette persist mat karo.
- System events sirf System selection ko affect karein; explicit selection
  restart aur OS theme change par preserve rahe.
- Buttons, inputs, cards, icons, navigation, status bars, sheets, modals,
  loading states aur visible toasts theme changes par update hon.
- Platform launch assets static ho sakte hain; runtime UI ka substitute nahi.
- Safe area, font scaling, wrapping aur touch targets preserve karo.

## Mandatory translation rules

- Har app-authored visible text translation keys se aaye; screens/components
  mein English/Hindi literals mat likho.
- Labels, placeholders, accessibility labels/hints, navigation titles, validation,
  loading/empty/error text, toast, alert aur confirmation text bhi translate karo.
- Existing `react-i18next` / `useAppTranslation()` use karo; second i18n instance
  ya duplicate translation directory mat banao.
- New key dono files mein add karo:
  `src/localizations/en/translation.json` aur `hi/translation.json`.
- English fallback maintain karo. Missing/empty translations raw keys na dikhayein.
- Full sentences translate karo; interpolation `t(key, { name })` aur plurals
  `t(key, { count })` use karo; fragments concatenate mat karo.
- Internal route IDs, enum/storage keys, user-entered content aur backend data ko
  translation keys samajhkar translate mat karo.
- Language state/persistence `src/store/languageStore.ts` own karta hai;
  `useLanguage()` se switch karo; Context compatibility facade mein duplicate
  `useState` mat add karo.
- Startup hydration complete hone par app flow render karo; invalid/corrupt
  preference par safe fallback aur recoverable error handling rakho.
- Hindi text ke liye fixed-height labels, unnecessary one-line truncation aur
  font scaling disable karna avoid karo.

## Reusable UI aur performance

- Naya Button/Input/Card banane se pehle `src/components/ui` aur existing
  components inspect karo. Existing names canonical implementation ko adapt karein.
- Public props typed/configurable hon; callbacks aur accessibility state expose
  karo. Loading/disabled button repeated action block kare.
- Minimum interactive target shared `sizes.touchTarget` se lo.
- Modal/backdrop/back-button dismissal aur keyboard/safe-area behavior verify karo.
- Component business API calls ya independent preference persistence na kare.
- Errors/loading/empty states explicit hon; render ke andar side effects mat karo.

## Environment aur logs

- Environment-specific public config existing dotenv setup se lo.
- `.env.example` mein placeholders only; secrets/tokens/passwords commit mat karo.
- Mobile bundle mein environment variables secret storage nahi hain.
- `src/utils/logger.ts` structured `debug/info/warn/error` use karo.
  Production logs disabled; development severity `LOG_LEVEL` se control ho.
- Request bodies, tokens, passwords, user profiles/PII aur raw network errors
  log mat karo. Event codes/status/duration jaise safe metadata use karo.
- Backend/database is repository mein nahi hain; unke logs/infra invent mat karo.

## Native aur validation

- App name BharatTalk, Android `com.bharattalk`, iOS `com.bharatTalk` preserve karo
  jab tak user rename authorize na kare.
- Package declarations, JS registration, native module names aur assets aligned
  rakho; rename checklist `docs/development.md` mein hai.
- Signing keys, release config aur permissions bina approval change mat karo.
- Android: physical wireless device prefer, existing Metro reuse, reconnect ke
  baad adb reverse restore; active ABI only build karo. Universal/clean builds
  default mat banao.
- Native changes ke baad actual Android/iOS build run karo; build blocked ho to
  exact command, exit/error aur baseline-vs-new distinction report karo.
- `yarn lint`, `yarn type-check`, `yarn test --runInBand` available checks hain.
  New issues fix karo; unrelated baseline failures ko honestly list karo.
- Theme/light/dark/system, restart persistence, English/Hindi, fallback/plurals,
  input/loading/disabled/modal states aur text scaling verify karo.
- Web surface testing ho to headless Playwright/Jest; native testing ka substitute
  browser screenshot nahi hai.

## Git, documentation aur delivery

- Main/dev par direct implementation avoid karo; feature branch use karo.
- GitHub interaction ke liye CLI preferred; `gh auth status` se
  `deepaktiwari09` account verify karo.
- Independent large tasks ko isolated worktrees/subagents mein divide karo;
  integration diff review aur tests ke baad karo.
- User data/changes preserve karo; shared history rewrite mat karo.
- Commits concise hon, user ne commit/push request nahi ki ho to unsolicited
  publish mat karo.
- Architecture, flows, tradeoffs, edge cases aur setup/recovery `docs/` mein
  update karo. Existing README onboarding link maintain karo.
- Final report mein changed files/groups, why, verification commands/evidence
  aur remaining issues/questions concise do; unrun checks ko passed mat bolo.
