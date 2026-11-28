# Module 6 — Earnings aur Wallet UI

[Module index aur shared setup](starter-setup.md) ·
[Module 4 — Home aur Bottom Tabs](main-tabs.md)

Status: local-data UI preview. Earnings, wallet balance, cash limit and chart values
are demo fixtures. No earnings/payment API, deposit transaction, external link or
new persistence is connected. The existing direct MainStack startup bypass remains.

## Screens and interaction

The Earnings bottom tab has two local tabs: All Earnings and Wallet. Switching
between them preserves the selected earnings range and period while the screen
remains mounted; selections are not saved across app restarts.

All Earnings defaults to Week, 26 Oct–01 Nov 2026, with a displayed total of $120,
five trips and 05:20 hours online. Day, Week and Month each offer three fixed demo
periods. Previous/next arrows stop at the available boundaries; the date control
opens a sheet for selecting one of those periods. Dates, chart and summary stats
update with the selected period. Dates are formatted through Intl in UTC so a
device's time zone cannot shift the fixture's calendar day.

The default chart labels are 150, 85, 158, 368, 471, 589 and 256. They reproduce the
reference illustration and intentionally do not sum to the displayed $120 total.
These independent static values are not reconciled accounting or live earnings.

Wallet shows a $1,000 balance and a $450 available cash limit. Deposit, balance,
cash-limit and View rate card controls only open a translated preview dialog.
They do not collect funds, alter amounts, open payment apps or navigate to a live
rate card. Dialog and period-sheet dismissal retain the current selection.

## Implementation

- `src/screens/main/tab/EarningsScreen.tsx`: All Earnings/Wallet selection and
  local range, period and preview-dialog state.
- `src/screens/main/earnings/EarningsOverview.tsx`, `EarningsChart.tsx`,
  `WalletPanel.tsx`, `earnings.styles.ts`: overview, amount/date chart, wallet controls and
  shared responsive styles.
- `src/screens/main/earnings/useEarningsLabels.ts`: translated amounts, labels
  and locale-aware date formatting.
- `src/constants/earnings.ts`: `EARNINGS_PERIODS` and `DEMO_WALLET` fixtures.
  `src/interface/earnings.type.ts` describes preview data, not a backend contract.
- `src/assets/svg/EarningsIcon.tsx`: theme-aware SVG icon variants, registered
  through the existing `SVG` export in `src/assets/index.ts`.

Existing AppBackground and reusable UI controls provide safe areas, text scaling,
button states and modal behavior. Colors use the central theme in both modes;
dimensions use `wp`, `hp` and `fSize`. The `earnings` namespace includes English,
Hindi and Spanish labels, accessibility copy and interpolated values. There are
no new dependencies, native settings or authentication changes.

## Verification

`yarn test --watchman=false --runInBand __tests__/earnings-ui.test.tsx
__tests__/main-tabs.test.tsx __tests__/trips-ui.test.tsx __tests__/theme.test.ts
__tests__/language.test.ts __tests__/spanish-resources.test.ts`: 41/41 tests pass.
Coverage includes period boundaries, sheet selection/dismissal, Wallet round-trip
selection, preview actions without network/Linking/data mutation, and live
Hindi/dark/enlarged-text changes.

All Earnings and Wallet were visually checked on the existing Android emulator
using Metro on 8081. Deposit preview, Android Back dismissal and period sheet
were also checked. Screenshots: `/private/tmp/uniride-earnings-all.png` and
`/private/tmp/uniride-earnings-wallet.png`. Physical device, iOS and release build
were not tested. Follow the workflow in [shared setup](starter-setup.md).

UI rules and diff checks pass. Type-check reports only the existing TextArea and
CardImageComponent errors. ESLint remains blocked by missing configuration.
