# Module 4 — Home Ride Preview

Parent: [Module 4 — Home aur Bottom Tabs](main-tabs.md).
Status: local interactive preview; backend dispatch, GPS tracking and real trip
verification are deferred. Existing tab bar remains visible throughout.

## Approved flow

1. Home starts Offline. Earnings $120, 5 trips and 5h 20m are labelled demo data.
2. Go Online shows the same summary with Online status and Go Offline action.
3. After 5 seconds, one demo request appears: $300, Forum Mall → TCS Tech Park.
4. The request has a 15-second deadline. Digits briefly fade each second and the
   red countdown ring rotates while its remaining arc shrinks. Reduced-motion
   users get static progress/digit updates. No animation changes the deadline.
5. Decline or timeout returns to Online waiting without another automatic offer.
   Go Offline → Go Online starts a fresh preview cycle. Going offline before
   the offer arrives cancels it.
6. Accept before expiry opens Arriving with rider details, pickup, navigation and
   a swipe control. Expired requests cannot be accepted, including after resume.
7. Slide Arriving to the right to open OTP. Four visual cells share one native
   input, preserving typed/pasted digit order and keyboard focus. Any four ASCII
   digits are accepted **only for this preview**, as requested. Start Trip is
   disabled until all four digits exist; swipe then shows Trip started.
8. End trip, cash collection and completion are outside this increment. Call/chat
   show Coming soon; Navigate opens Google Maps directions for the demo pickup.
   The bell opens existing notification preferences. Emergency sheet opens the
   system dialer at product-provided 123; it does not place a call automatically
   or promise an ambulance arrival time.
   Emergency help reuses the shared `BottomSheet` with `edgeToEdge`: full viewport
   width, rounded top corners and safe bottom padding, matching the Logout sheet.

## State and lifecycle

- `homeRideStore.ts` owns a discriminated state: offline, online, request,
  arriving, otp, started. No duplicate local availability/offer state or storage.
  OTP itself remains in component memory; logs never contain its value or rider data.
- `RideOffer` carries its own `expiresAt` and `durationMs`; a future backend
  adapter can call `receiveOffer` with a server-derived deadline. Real server
  clock alignment, acceptance and OTP verification must replace this preview.
- `useHomeRideLifecycle` delivers demo offers only while Home is focused and the
  app is foregrounded. Request expiry reconciles elapsed wall-clock time on
  resume; it is not paused/restarted. Accept also checks the deadline directly.
- MainTabs unmount/logout resets the preview. Cold start begins Offline. Tab
  changes preserve accepted-trip state. Timers and animation listeners clean up.
- `SwipeAction` confirms at 85% of its travel, returns after a short swipe and
  blocks duplicate completion. Screen-reader activation provides an equivalent
  action. Shared scaled text and scrollable cards support larger text settings.
- English/Hindi/Spanish copy and central light/dark tokens cover the full UI.
- Every Home map state draws behind the transparent status bar via
  `AppBackground.extendUnderStatusBar`. The toolbar alone adds the top safe inset;
  clock/battery icons use contrast appropriate for the map theme. AppBackground's
  optional `statusBarStyle` also supports future map screens without forcing the
  white icon style used by the auth photo header.

## Map setup

`react-native-maps` was already installed. Android uses Google Maps; iOS currently
uses the existing Apple Maps provider. No GPS permission or location dependency
was added. Driver/pickup coordinates remain demo values in `constants/homeMap.ts`.
With configured keys, Android renders live Google map tiles and a road route
returned by Google Routes API. Passenger, price, distance/ETA labels and dispatch
remain explicitly demo data; they are not derived from this geometry response.

Add `GOOGLE_MAP_API_KEY=your_android_maps_key` to the ignored root `.env`.
Add `GOOGLE_ROUTES_API_KEY=your_routes_key` for road geometry and enable
**Routes API** in the associated Google Cloud project.
The public variable is documented in `.env.example`; do not commit real keys.
Enable **Maps SDK for Android** in Google Cloud and apply Android app restrictions
for package `com.uniride.partner` and the appropriate signing certificate SHA-1.
Places API is for place search/details; this screen does not need that endpoint.
See [Google Android SDK key setup](https://developers.google.com/maps/documentation/android-sdk/get-api-key).
Route requests follow [Google Compute Routes](https://developers.google.com/maps/documentation/routes/compute_route_directions).

`service/rest/googleRoutes.ts` uses a dedicated transport, without the app API's
authentication headers. Only polyline geometry is requested. `useDrivingRoute`
loads when a ride needs a route, cancels work when hidden/unmounted, ignores stale
responses, and caches successful geometry for five minutes in component memory.
The service limits requests to ten seconds and validates decoded coordinates.
Missing/invalid keys, HTTP failures and unavailable routes show translated retry
feedback over the real map; no fabricated road route is substituted. Errors log
safe codes/status only, never keys, raw responses or location data.

Mobile env values are public bundle configuration. For production dispatch,
move Routes requests to the backend and apply appropriate key restrictions;
the Maps SDK key and REST key have different application restriction needs.

`android/app/build.gradle` reads this variable from the process environment or
root `.env` and passes it to manifest `com.google.android.geo.API_KEY`.
The existing react-native-dotenv setup supplies the JS value. Native and JS builds
must use the same key/configuration. After changing the key, rebuild/install:

```sh
cd android
./gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a
```

Install the resulting debug APK on the matching device and reload the existing
Metro bundle; if dotenv stays cached, restart that Metro process with reset-cache.
Do not start a second Metro server. Restore `adb reverse tcp:8081 tcp:8081` after
reconnect. Use the connected device's ABI if it differs from this example.

Missing Android key renders a labelled vector demo map without mounting native
Google Maps. Configured maps wait for `onMapLoaded`; after twelve seconds a retry
action remounts the native map. They do not silently fall back to the vector demo.
Some authorization/tile failures require native diagnostics; the load callback
cannot diagnose every credential failure. Google Maps on iOS still requires
separate native setup/key and was not added in this Android integration.

## Verification

- Final focused checks: **42/42 passed** across Home UI/state, countdown, swipe,
  tabs, startup and Spanish resource parity. Full regression: **155 passed / 8
  pre-existing failures** in legacy logout/shared UI/biometric suites.
- Android arm64 debug build succeeded; emulator installation succeeded. Existing
  Metro reused. No physical device connected; iOS build/rendering not verified.
- Store tests cover scheduling, offline cancellation, decline/expiry, acceptance
  at deadline, backend-shaped timing, valid/invalid OTP and reset. Countdown tests
  cover resume, once-only expiry, reduced motion and cleanup. Swipe accessibility
  and complete Home composition have focused tests.
- Native captures under `/private/tmp/home-*.png`: Offline, Online waiting,
  countdown request, Arriving, OTP and Started. Actual dragging verified both
  Arriving and Start Trip; the four-digit preview started successfully.
- Final single-input OTP verified with 8291 in the correct order. Hindi/Dark
  Started layout inspected.
- A development Fast Refresh after changing hook structure produced a blank
  screen; cold relaunch recovered without rebuild. Cold-start auth/Home flow
  was rechecked. No runtime error was recorded in the filtered native error log.
- TypeScript retains two baseline errors in TextArea/CardImageComponent. Existing
  legacy logout/shared-UI/biometric test failures are unrelated to this feature.
  Real dispatch and real OTP remain deferred.

### Live map integration verification

- `yarn test --watchman=false --runInBand __tests__/google-routes.test.ts
  __tests__/driving-route-hook.test.tsx __tests__/home-ride-ui.test.tsx
  __tests__/spanish-resources.test.ts __tests__/starter-flow.test.tsx`: 45/45 pass.
- `yarn check:ui` and `git diff --check` pass. `yarn type-check` still reports
  only the existing TextArea/CardImageComponent errors. ESLint config is missing.
- Android arm64 debug rebuild/install succeeded with the existing Metro reused.
  Live Google response: HTTP 200, one route with geometry (key values not logged).
- Emulator verified real tiles behind the status bar on Offline and a Google
  road-following polyline on New ride request. Evidence:
  `/private/tmp/google-map-check.png`, `/private/tmp/google-map-route.png`.
- Route tests cover missing key, malformed/no-route data, HTTP/network failures,
  timeout, abort, coordinate bounds, cache reuse, retry and stale response cleanup.
  iOS Google provider and physical-device rendering remain unverified.
