# Glovebox 🚗

> A browser that lives in your car's glovebox — full-screen, voice-first, with a Drive Mode switch you control.

Glovebox is an Android browser built for the car. It runs full-screen on a phone (and on a phone projected to a head unit via Android Auto), has a Drive Mode switch you turn on yourself. It never switches itself on or closes a page, and lets you do the few things you actually need on the road — read a page aloud, go back, open a saved link, or search by voice — without touching anything.

## Why this exists (research summary)

I surveyed the existing landscape before designing this. Short version: the pieces exist, but nobody has combined them into a safety-first, car-native browser.

| Project / app | What it does | Gap Glovebox fills |
|---|---|---|
| [AABrowserCharles](https://github.com/thiarley/AABrowserCharles) | Web browser that appears in the Android Auto launcher | Works, but a generic browser: no drive-mode logic, no voice-first UI |
| [HeadUnit Revived](https://github.com/andreknieriem/open-headunit) | Open-source Android Auto head-unit emulator (Wi‑Fi/wireless, USB) | Projects the *phone's* Android Auto; it is not a browser. Glovebox can be a companion to it, not a replacement |
| [mretallack/AndroidAuto](https://github.com/mretallack/AndroidAuto) | Open implementation of the phone-side Android Auto protocol (WIP) | Protocol-level research project; not usable as an app |
| Vivaldi for Android Automotive | Full browser on Polestar 2 (Android Automotive OS, not Android Auto) | Proprietary, tied to AAOS hardware, and blocks use while in transit |

Takeaways that shaped the design:

1. **Android Auto's official app model does not include a general web browser.** Browsers can only be surfaced by sideloading through the "unknown sources" developer route, which is fragile across Android versions (Android 15/16 added checks that remove sideloaded apps after reboot). Glovebox is therefore designed to be a normal phone app first, and the car surface is a bonus layer.
2. **Wireless Android Auto needs Android 11+, 5 GHz Wi‑Fi on the phone, and a head unit with wireless support.** Older phones or 2.4 GHz-only devices will not connect wirelessly. Wired works on Android 9+ for the projection itself.
3. **Drive safety is the real product problem.** The existing browser projects typically let you watch video and bypass Android Auto's "video lock" (HeadUnit Revived's wiki explicitly advertises this). Glovebox does the opposite: it enforces the lock.

## Name

**Glovebox** — the place you keep the things you reach for on the road. It is short, memorable, and implies "stored things, quickly reachable," which is exactly what the app does.

## Features

- Full-screen WebView browser with an address bar when parked
- **Drive Mode**: a switch you turn on and off yourself. The app never reads your speed or turns it on for you. When it's on, playing video and audio are paused and new pages can't be opened
- **Voice-first controls**: voice search, "read this page" (text-to-speech of the page's main text), back, home
- **Video lock**: video and autoplay media are paused while driving (the opposite of common sideloaded browsers)
- **Pin for the road**: save up to five links as big tiles for Drive Mode home screen
- Wireless-Android-Auto-ready: built as a standard fullscreen Android activity, so it works when projected by any Android Auto head unit or a compatible projection app
- Night-friendly dark theme

## Project layout

```
glovebox/
├── README.md
├── settings.gradle.kts
├── build.gradle.kts
├── gradle.properties
├── .gitignore
└── app/
    ├── build.gradle.kts
    └── src/main/
        ├── AndroidManifest.xml
        ├── java/app/glovebox/
        │   └── MainActivity.kt        # Home screen, native browser, Drive Mode switch, voice
        └── res/
            ├── layout/activity_main.xml
            └── values/
                ├── strings.xml
                └── themes.xml
```

## Build

Requirements: Android Studio (Ladybug or newer), JDK 17, Android SDK 35, Node 20.

**The app shows the GloveBox UI from `web/`, so bundle it first** (CI does this automatically):

```bash
(cd web && npm install && npm run build)
rm -rf app/src/main/assets/glovebox && mkdir -p app/src/main/assets && cp -r web/dist app/src/main/assets/glovebox
```

Without this step the home screen shows a blank page.

Easiest path: open the folder in Android Studio. It downloads Gradle and the SDK and creates the Gradle wrapper on first sync. Then press Run.

From the command line, after the wrapper exists:

```bash
git clone https://github.com/<you>/glovebox.git
cd glovebox
gradle wrapper --gradle-version 8.9   # one-time, needs a local Gradle install
./gradlew :app:assembleDebug
```

Install on your phone (developer options → USB debugging enabled):

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Using it in the car

1. **Wired**: plug the phone into the head unit. Open Android Auto's launcher settings and make sure Glovebox is enabled if your head unit lists third-party apps.
2. **Wireless**: on the phone, Android 11+ with 5 GHz Wi‑Fi. In Android Auto settings, enable "Wireless Android Auto" and pair over Bluetooth once.
3. Turn Drive Mode on yourself from the top bar or Car settings when you want it. Glovebox doesn't switch it on by itself, and it doesn't close pages you have open. While it's on, playing video and audio are paused and new pages can't be opened. Turn it off the same way.

## Safety and legal notes

- Glovebox never lets you type into the browser while driving; voice is the input path.
- Some countries and US states restrict handheld use and screen content visible to the driver. Keep Drive Mode on, and do not disable the video lock.
- The sideloaded Android Auto route requires enabling developer settings and unknown sources. That is a user choice, and Google can change it at any time.

## Roadmap

- [x] Fullscreen browser, address bar, back/home
- [x] Manual Drive Mode switch (user-controlled; the earlier GPS speed detection was removed at the user's request)
- [x] Video lock while driving
- [x] Voice search and read-aloud
- [x] Pinned road tiles (up to 5, `PinStore`, unit-tested; pinned from the Pins dialog)
- [x] CI: unit tests and debug APK build on every push (GitHub Actions)
- [ ] Remove or rename a pin (needs a small management screen)
- [ ] Car App Library surface for Android Auto's official templates (only if a permitted category fits)
- [ ] Offline reader mode for long articles

## Tests

```bash
gradle :app:testDebugUnitTest
```

Unit tests cover pin storage (parsing, sanitizing, limits). The Android UI, voice, and video lock paths are not covered by unit tests and need a manual test.

## Status

Feature-complete for v0.1 in code. GitHub Actions compiles the app, runs the unit tests, and builds the debug APK on every push. The latest runs on `main` pass and attach the APK as the `glovebox-debug-apk` artifact. It has also **not been tested on a real car or head unit**. The first real milestone is: install on your phone, drive, and confirm the Drive Mode switch pauses video and that nothing turns it on or closes a page without you.

## License

MIT

## Web prototype (`web/`)

An interactive React + TypeScript prototype of the GloveBox interface. It runs in any browser and is meant for design review and layout testing. It is not the Android app.

```bash
cd web
npm install
npm run dev      # local development server
npm run build    # type-check and production build into web/dist
```

Screens: Home, Browser, Media, Navigation, App Library, Car & Connectivity, Settings, and Assistant. Preferences and pins persist in `localStorage`.

Limitations:
- Media playback, navigation routes, weather, and traffic are **simulated**. No streaming, map, or vehicle data is connected.
- Many websites block being shown inside other pages. The browser offers "Open in new tab" for those.
- The assistant runs local commands only. No AI provider is connected.
- The web prototype cannot run on a car display. Android Auto requires the native Android app.
