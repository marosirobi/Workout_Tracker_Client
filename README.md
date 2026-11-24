# Workout Tracker

Android app for logging strength and cardio workouts, inspired by Strava and Hevy. It talks to the Workout Tracker API, a Spring Boot backend in a separate repository.

## Features

- Registration and login with automatic token refresh
- Strength workouts: exercise library, sets with weight, reps or duration, workout templates
- Cardio workouts with live GPS tracking, map and a persistent notification while the screen is locked
- Workout history and activity calendar, editing saved workouts
- Exercise statistics, personal records and best efforts for running distances
- Body weight tracking
- Hungarian and English user interface with locale-aware number formatting

## Tech stack

- Expo SDK 57, React Native 0.86, TypeScript
- Expo Router (file-based navigation), Zustand (state), Axios (HTTP)
- i18next / react-i18next
- expo-location and expo-task-manager for GPS, MapLibre for maps
- A local Expo native module (`modules/workout-notification`) for the Android workout notification and foreground service
- React Compiler
- Jest (jest-expo) for unit tests
- EAS Build for release builds

## Requirements

- Node.js (current LTS) and npm
- Android Studio with the Android SDK, and an Android phone (USB debugging enabled) or emulator
- A running backend (see the backend README)

The app uses custom native code, so it does not run in Expo Go. It needs a development build (`npx expo run:android`) or an EAS build.

iOS is not maintained at the moment.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env.local` file in the project root with the backend address:

   ```
   EXPO_PUBLIC_API_URL=http://192.168.1.10:8082
   ```

   Use the IP address of the computer running the backend, not `localhost`, because the phone has to reach it over Wi-Fi. Do not add `/api`, the app appends it. Without this variable the app stops at startup with `EXPO_PUBLIC_API_URL is not set`. `.env.local` is git-ignored.

3. Start the backend in development mode (it listens on port 8082).

4. Build and start the app on a connected device or emulator:

   ```bash
   npx expo run:android
   ```

   Later, when only JavaScript changes, starting Metro is enough:

   ```bash
   npx expo start -c
   ```

   The `-c` flag clears the Metro cache; use it after changing `.env.local`.

The phone and the computer must be on the same Wi-Fi network (or connected with USB), because the development build loads its JavaScript from Metro running on the computer.

Port note: Metro uses port 8081. If the production backend also runs in Docker on the same machine on port 8081, stop it while developing (`docker compose stop backend`) or move it to another host port.

## Environment variables

| Variable | Where it is set | Description |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `.env.local` for development, `eas.json` for EAS builds | base address of the backend, without `/api` |

`EXPO_PUBLIC_` variables are inlined into the JavaScript bundle at build time, so changing them requires restarting Metro or making a new build.

## Scripts

```bash
npm test            # unit tests (Jest)
npm run lint        # ESLint
npx tsc --noEmit    # type check
```

## Building an APK with EAS

Release builds are made in the cloud with EAS Build. The profiles are defined in `eas.json`:

| Profile | Output | Use |
|---|---|---|
| `preview` | `.apk` | install directly on phones, share with testers |
| `production` | `.aab` | Google Play (not used yet) |

Both profiles set `EXPO_PUBLIC_API_URL` to the public backend address.

First time:

```bash
npm install -g eas-cli
eas login
eas init
```

Build:

```bash
eas build -p android --profile preview
```

When the build finishes, EAS shows a link and a QR code for downloading the APK. Installing it requires allowing installation from unknown sources on the phone.

For every new release, increase `android.versionCode` in `app.json` so phones install it as an update. EAS stores the signing key, so all builds are signed with the same key.

A development build and an EAS build use the same application id with different signing keys, so only one of them can be installed on a phone at a time.

## Project structure

```
src/
  app/          screens and navigation (Expo Router file-based routes)
  screens/      screen components
  components/   reusable UI components
  api/          Axios client and API services
  store/        Zustand stores (auth, settings, active workout)
  services/     GPS tracking (background task, foreground watch)
  hooks/        custom React hooks
  i18n/         translations (hu, en) and locale helpers
  utils/        formatting, validation and workout analysis helpers (with tests in __tests__)
  styles/       shared styles
  widgets/      iOS live activity (not maintained)
modules/
  workout-notification/   local native module for the Android workout notification
```
