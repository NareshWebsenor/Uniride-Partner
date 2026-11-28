This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

Startup hydrates preferences, opens `SplashScreen`, and restores a valid
Keychain driver session into `MainStack`/Home; otherwise it opens `LoginScreen`
(Login/Register) with protected-route guards enforced in `Application.tsx`.
See [Module 2 — Auth Flow](docs/auth-flow.md).

Trips has Completed, Upcoming and Incomplete lists plus status-specific details.
This is a local-data UI preview with SVG maps; contact, cancel and navigation
controls show a demo dialog. See [Module 5 — Trips UI](docs/trips.md).

Earnings has All Earnings/Wallet tabs, fixed Day/Week/Month demo periods, a chart
and wallet cards. Deposit and rate-card actions are preview-only; no payment is
made. See [Module 6 — Earnings aur Wallet UI](docs/earnings.md).

Inbox has All/Unread passenger lists and chat screens with local messages and
quick replies. Conversations reset on restart; no messages are sent to passengers.
See [Module 7 — Inbox aur Chat UI](docs/inbox.md).

Driver auth APIs are integrated: email/password login + `GET /v1/driver/me` profile restore a secure session;
registration uses email-only sign-up → 4-digit email OTP → conditional mobile +
4-digit phone OTP (when `phone_required: true`) → create password → drive mode
→ optional 6-digit fleet invitation code / own-vehicle catalog → dynamic
application/vehicle form → Terms + submit → Under review. `email` and `phone`
are excluded from `answers` (`first_name`/`last_name` come from dynamic form
fields). Home rides remain a demo; biometric source remains deferred.

Set `DRIVER_API_BASE_URL_DEV`, `DRIVER_API_BASE_URL_PROD` and `UNIRIDE_WORKSPACE`
using `.env.example`. API origins exclude `/v1`; the client adds it. Registration
and login credentials use separate workspace-scoped Keychain entries. Live
account/email/upload/submission verification requires an authorized test account.

[Module index aur shared setup](docs/starter-setup.md) ·
[Module 1 — Splash aur Biometric](docs/starter-setup.md#module-1--splash-aur-biometric) ·
[Module 1 — Biometric implementation](docs/biometric-app-lock.md) ·
[Module 1 — Biometric integration guide](docs/fingerprint-lock-integration.md) ·
[Module 2 — Auth Flow](docs/auth-flow.md) ·
[Module 3 — Driver Onboarding](docs/driver-onboarding.md) ·
[Module 4 — Home aur Bottom Tabs](docs/main-tabs.md) ·
[Module 4 — Text Size](docs/text-size.md) ·
[Module 4 — Menu Details](docs/menu-details.md) ·
[Module 4 — Home Ride Preview](docs/home-rides.md) ·
[Module 5 — Trips UI](docs/trips.md) ·
[Module 6 — Earnings aur Wallet UI](docs/earnings.md) ·
[Module 7 — Inbox aur Chat UI](docs/inbox.md).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
