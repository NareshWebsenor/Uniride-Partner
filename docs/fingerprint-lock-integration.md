# Module 1 — Splash aur Biometric: Integration Guide

Ye Module 1 ka supporting guide hai; iska separate module number nahi hai.
[Module index aur splash/startup](starter-setup.md) ·
[Module 1 biometric implementation](biometric-app-lock.md) ·
[Module 2 — Auth Flow](auth-flow.md).

Ye guide doosre React Native CLI + TypeScript app mein app lock integrate karne
ke liye hai. Is document se runtime feature automatically enable nahi hota.

## Confirmed requirement

- App khulte waqt aur background se wapas aate waqt authentication chahiye.
- Fingerprint/available supported biometrics ke saath device PIN/passcode fallback chahiye.
- Android aur iOS ke native authentication prompt use karo; custom fingerprint
  scanner ya app ke andar device PIN input mat banao.
- Device PIN/passcode local lock unlock karta hai; backend login replace nahi karta.

## Source project ki actual state

Is repo mein React Native `0.84.1` aur `react-native-keychain` `10.0.0` declared hain.
Biometric source preserved hai, lekin `App.tsx` gate mount nahi karta aur Settings
mein lock switch nahi hai. Current starter mein app lock active nahi hai.

Purana gate customer session, route IDs aur logout helper par depend karta hai.
Doosre app mein files paste karke feature complete assume mat karo. Details:
[module index/shared setup](starter-setup.md) aur
[Module 1 — Biometric legacy behavior](biometric-app-lock.md).

## Integration ke liye source map

- `src/service/biometricAppLock.ts`: Keychain operations, preference aur typed results.
- `src/components/auth/BiometricAppLockGate.tsx`: startup, lifecycle aur prompt coordination.
- `src/components/auth/BiometricLockModal.tsx`: failed/cancelled prompt ke baad retry UI.
- `src/context/BiometricAppLockContext.ts`: enabled state aur Settings bridge.
- `src/screens/settings/components/BiometricAppLockPreference.tsx`: enable/disable flow.
- `src/navigations/Application.tsx`: initial aur subsequent route notifications.
- `src/service/startup.ts`: legacy local-session check; target app ke auth se adapt karo.
- `src/utils/helper.utils.ts`: legacy logout dependency; target app ka logout use karo.
- `src/localizations/{en,hi}/translation.json`: `appLock` copy.
- `__tests__/biometric-app-lock*.test.*`: reference scenarios; fixtures adapt karo.

`BiometricLockScreen.tsx` retained alternate UI hai; current gate retry modal use
karta hai. Dono lock UIs ek saath mount mat karo. Imports, shared UI, theme,
translation hooks, logger aur path aliases target app ke existing modules se map karo.

## Dependency aur native setup

1. Target app ka RN version, installed security library, minimum OS versions aur
   native architecture inspect karo. Compatible package version lockfile mein pin karo;
   source ka `10.0.0` reference version hai, universal compatibility claim nahi.
2. Existing equivalent dependency na ho to target package manager se
   `react-native-keychain` aur `@react-native-async-storage/async-storage` install karo.
3. iOS mein project ke CocoaPods workflow se pods install karo, phir native rebuild.
   Example: `cd ios` ke baad `bundle exec pod install`, agar Bundler configured ho.
4. Face ID support ke liye target `Info.plist` mein meaningful
   `NSFaceIDUsageDescription` rakho; supported languages ke liye localize karo.
5. Android merged manifest mein selected library ke biometric permissions verify karo.
   Dono platforms rebuild karo; sirf Metro reload native dependency install nahi karta.
6. Target package/bundle ID preserve karo. Keychain service ko target app ke unique
   namespace mein set karo, example `com.example.targetapp.biometric-app-lock`.
   Source ke `com.bharattalk` service aur sentinel username ko blindly copy mat karo.

Keychain setup aur native rebuild guidance:
[official installation entry point](https://oblador.github.io/react-native-keychain/docs/).

## Storage aur authentication policy

- Persist sirf enabled preference; unlocked state memory mein rakho.
  Process restart par previous unlock restore mat karo.
- Keychain mein app-lock ke liye protected non-secret sentinel rakho. Biometric
  success protected Keychain operation se establish ho, availability check se nahi.
- Source policy: `BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE`,
  `DEVICE_PASSCODE_OR_BIOMETRICS`, aur iOS `WHEN_UNLOCKED_THIS_DEVICE_ONLY`.
  Selected version aur device par fallback behavior verify karo.
- Source guide ke mutabik Android 11+ par credential fallback supported hai;
  older Android par same behavior assume mat karo. Target-supported devices par
  PIN/pattern/password fallback acceptance test mandatory hai.
- Source enable flow enrolled biometrics require karta hai. Agar target app ko
  bina enrolled fingerprint ke PIN-only enable karna hai, capability policy adapt
  karni hogi; current source ko PIN-only support mat samjho.
- Missing/invalid credential, enrollment change ya storage error par silently
  unlock mat karo. Recovery ke baad successful native authentication ya target
  app ki verified account recovery chahiye.
- Source missing sentinel recreate kar sakta hai; target mein ensure karo ki
  recreate success akela unlock na kare, native authentication prove hui ho.
- Preference AsyncStorage mein hai; UI gate encrypted app data ya backend
  authorization ka replacement nahi. Existing token storage ko is migration
  ke bahane change mat karo.

## Target integration order

1. Service port/adapt karo: unique storage keys, typed failure reasons aur safe logs.
2. Root par theme/language hydration ke baad ek gate mount karo. Source gate khud
   `Application` render karta hai; use wrap karte waqt second navigator mat mount karo.
3. Target auth boundary map karo. Login wale app mein signed-out public routes
   accessible rahen; protected routes par gate enforce ho. Session expire ho to
   target login flow chale. Local expiry check server validation nahi hai.
4. Login-less app mein `hasActiveCustomerSession` aur `onLogout` dependencies
   remove/adapt karo; enabled app lock ko token absence se bypass mat hone do.
5. Navigator ready aur route change dono report karo. Hardcoded `MainStack`,
   `SettingsScreen`, `AuthStack`, `LandingScreen` ko target route policy se replace karo.
   Deep links aur notification navigation bhi same gate ke andar aayen.
6. Settings switch ko shared gate state se connect karo. Enable tab persist ho
   jab protected credential create/read aur native authentication successful hon.
   Cancel/error par switch disabled rahe; busy state repeat taps block kare.
7. Disable action unlocked Settings se chale. Storage failure par success mat dikhao;
   credential aur preference ke partial updates ka recovery path rakho.
8. English/Hindi labels, prompts, retry/errors aur accessibility text add karo.
   Target theme tokens use karo; fixed colors ya duplicate preference store mat banao.

## Startup aur foreground flow

```text
App launch -> preferences/auth hydrate -> lock policy check
  Disabled                  -> normal app flow
  Enabled + protected area  -> lock UI -> native prompt
    Success + valid session -> unlock
    Cancel/failure          -> locked UI -> explicit Retry

Background/inactive -> locked
Foreground          -> native prompt -> success par unlock
```

- Grace period default zero: har genuine background return par re-authenticate karo.
- Ek waqt mein ek native request. Repeated foreground events/retry taps se duplicate
  prompts na khulen; pending request ke dauran next genuine foreground event queue karo.
- Attempt ko lifecycle/session generation se associate karo. Background, logout,
  account switch ya unmount ke baad late success current screen unlock na kare.
- Native prompt khud lifecycle events trigger kar sakta hai. Android/iOS device par
  verify karo ki prompt-dismissal se endless authentication loop nahi banta.
- Locked UI touches, Android Back, modal dismissal aur underlying accessibility
  navigation block kare. Prompt hide/show hone par protected interaction enabled na ho.
- Reference modal background content visible rakhta hai. Target mein sensitive content
  ho to opaque cover use karo. JS overlay ko app-switcher snapshot protection ki
  guarantee mat samjho; woh separate native privacy requirement hai.

`inactive` iOS lifecycle state hai; Android notification drawer `blur` fire kar
sakta hai bina AppState change ke. Background-return logic ko in events ke saath
device par validate karo. [React Native AppState](https://reactnative.dev/docs/0.84/appstate).

## Edge cases aur acceptance checks

- First install: recommended opt-in default off; enable success ke baad restart lock.
- Kill/relaunch aur foreground return: successful authentication se pehle access blocked.
- Cancel, failed scan, OS lockout, no enrollment aur unavailable hardware: no bypass;
  supported device credential fallback ya clear retry/recovery message.
- Device PIN/passcode success: local unlock; expired server session phir bhi login maange.
- Missing/corrupt preference: documented safe recovery; unexpected value ko silently
  disabled mat treat karo. Source preference parser ko target policy ke liye review karo.
- Enrollment change, passcode removal, missing sentinel, read/write failure: locked
  recovery; preference silently reset nahi.
- Rapid background/foreground, pending native prompt, repeated Retry aur unmount:
  one prompt at a time, stale result ignored, no infinite loop.
- Deep link/notification, Android Back aur accessibility: protected route bypass nahi.
- Logout/account switch: previous unlock state aur pending results invalidate hon;
  target account policy ke hisaab se preference/credential cleanup ho.
- Light/Dark/System, English/Hindi, text scaling aur disabled/loading states verify karo.

Source tests ko fresh device-validation evidence mat mano. Existing starter notes
biometric test failures report karti hain; target mocks aur assertions current
policy se align karke service/gate tests run karo.

## Build, test aur recovery

Target scripts available hon to `yarn lint`, `yarn type-check`,
`yarn test --runInBand` run karo. Native biometrics ke liye physical Android device
aur supported iOS device par native builds/test zaroor karo.

```sh
adb pair <device-ip>:<pair-port>
adb connect <device-ip>:<debug-port>
adb devices -l
adb reverse tcp:8081 tcp:8081
adb reverse --list
adb shell getprop ro.product.cpu.abi
```

Existing target-project Metro reuse karo; zarurat par `yarn start`. Example
`arm64-v8a` device ke liye `android` directory se:

```sh
./gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a
```

Standard debug APK, project root se install:

```sh
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Flavors hon to target variant/path adapt karo. App launcher se target app kholo.
Disconnect par reconnect -> reverse restore -> Metro directory/port check -> relaunch.
Default clean/universal build mat karo. iOS ke liye target ka existing Xcode scheme
ya configured `yarn ios` workflow use karo; signing identity preserve karo.

Dev-only structured events jaise `app_lock.enabled`, `app_lock.unlocked`,
`app_lock.authentication_failed` log karo. Tokens, PIN, PII aur raw native errors
log mat karo; production logging disabled rahe.

## Target app handoff

Confirmed: React Native CLI, startup + background-return lock, device credential fallback.
Recommended default: Settings opt-in; target product ki policy alag ho to adapt karo.
Implementation se pehle target repo mein auth mode, supported OS versions, route
names aur existing UI/security dependencies inspect karo. Backend/database schema
change is local-lock guide ka requirement nahi hai.

Is document ke saath target repo dene par developer integration kar sakta hai.
Abhi sirf guide create hui hai; target app implementation aur hardware verification pending hain.
