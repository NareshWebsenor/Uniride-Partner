# Module 5 — Trips UI

[Module index aur shared setup](starter-setup.md) ·
[Module 4 — Home aur Bottom Tabs](main-tabs.md)

Status: UI preview with local demo trips. Backend trip history, scheduling,
cancellation, messaging, calling and navigation are not connected. The current
MainStack launch bypass remains unchanged.

## Screens and flow

MainStack → Trips opens Completed by default. The three category tabs retain the
main bottom bar; trip details open the root `TripDetailsScreen` route with
`{ tripId }`, hiding the bottom bar. Back returns to the selected list category.

- Completed cards show earned fare, commission, time, duration, distance, cash
  collected, the decorative map and pickup/drop-off addresses.
- Upcoming cards show scheduled pickup, route, estimated earnings and View trip.
  Scheduled details include route, passenger contact controls, fare breakdown,
  Cancel trip and Navigate to pickup.
- Incomplete cards cover Cancelled and Missed trips, with their reason and View
  trip. Details show the matching explanation, planned route, zero earnings and
  Contact support. Completed details show the finished trip and actual earnings.

Cancel, Call, Message, Help, Navigate and Contact support open a translated preview
dialog. They do not change a trip, launch another app or send a request. Dismissing
the dialog keeps the current screen. An unknown trip ID renders an unavailable
state instead of fabricated detail data; an empty category has explicit empty copy.

## Implementation

- `src/screens/main/tab/TripsScreen.tsx`: category selection and list composition.
- `src/screens/main/trips/TripCard.tsx`, `TripParts.tsx`, `trip.styles.ts`:
  shared cards, status/route presentation and responsive styles.
- `src/screens/main/trips/TripDetailsScreen.tsx`: status-specific detail sections
  and local preview-dialog state.
- `src/constants/trips.ts`: readonly `DEMO_TRIPS` and category filtering.
  `src/interface/trip.type.ts` defines the local preview types, not an API contract.
- `src/interface/navigation.type.ts` and `src/navigations/Application.tsx` own the
  typed root detail route. No auth or backend transport changes are required.
- `src/assets/svg/TripIcon.tsx` and `TripRouteMap.tsx` are registered in
  `src/assets/index.ts` and consumed as `SVG.TripIcon` / `SVG.TripRouteMap` through
  `@/assets`, alongside the existing `IMAGES` registry. The map is a decorative SVG illustration,
  not a real route or location result; it has no network/map-provider dependency.

All demo dates, names, addresses, fares and reasons are reference fixtures, not
live driver data. Selected category and modal state are local to the UI; no new
store or persistence is added, and no trip API is called.

## Theme and localization

Existing AppBackground, Card, Button, Text and Modal components are reused.
Colors come from the central theme; `successSurface` and `errorSurface` provide
matching status backgrounds in light and dark modes. SVG assets react to the same
theme. Responsive `wp`, `hp` and `fSize` sizing, safe areas, text scaling and touch
targets follow the shared UI rules.

The `trips` namespace in English, Hindi and Spanish covers labels, full sentences,
accessibility text, status names, demo copy and plural counts. Display values use
interpolation rather than concatenated translated fragments.

## Verification

`yarn test --watchman=false --runInBand __tests__/trips-ui.test.tsx
__tests__/main-tabs.test.tsx __tests__/theme.test.ts __tests__/language.test.ts
__tests__/spanish-resources.test.ts`: 35/35 tests pass. Coverage includes category
filtering, detail routing, each status, fare display, unavailable IDs, preview
dialogs with no fetch/Linking calls or data mutation, and Hindi/dark mode.

Existing Android emulator + Metro were reused. Completed, Upcoming, Incomplete,
scheduled details, header Back and preview-dialog dismissal were visually checked.
Screenshots are in `/private/tmp/uniride-trips-*.png`. Physical-device, iOS and
release-build checks were not run. SVG maps and all trip data remain illustrative.

`yarn check:ui` and `git diff --check` pass. `yarn type-check` reports only the
pre-existing TextArea/CardImageComponent errors. `yarn lint` cannot run because
ESLint configuration is missing. Device/Metro recovery remains documented in
[shared setup](starter-setup.md).
