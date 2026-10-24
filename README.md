# Glovebox 🚗

> A browser that lives in your car's glovebox — full-screen, voice-first, and locked into a safe "Drive Mode" whenever the car moves.

Glovebox is an Android browser built for the car. It runs full-screen on a phone (and on a phone projected to a head unit via Android Auto), switches into a driver-safe layout automatically when the car is moving, and lets you do the few things you actually need on the road — read a page aloud, go back, open a saved link, or search by voice — without touching anything.

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
- **Drive Mode**: automatic when GPS speed exceeds ~18 km/h (5 m/s). Hides the address bar, pauses any playing video, shows large buttons only, and turns on read-aloud
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
        │   ├── MainActivity.kt        # Browser UI, Drive Mode switch, voice, TTS
        │   └── DriveModeMonitor.kt    # GPS speed → driving / parked with hysteresis
        └── res/
            ├── layout/activity_main.xml
            └── values/
                ├── strings.xml
                └── themes.xml
```

## Build

Requirements: Android Studio (Ladybug or newer), JDK 17, Android SDK 35.

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
3. Drive as usual. Glovebox switches to Drive Mode on its own. Stopped at a light? It stays in Drive Mode for 30 seconds after you stop, then returns to full controls.

## Safety and legal notes

- Glovebox never lets you type into the browser while driving; voice is the input path.
- Some countries and US states restrict handheld use and screen content visible to the driver. Keep Drive Mode on, and do not disable the video lock.
- The sideloaded Android Auto route requires enabling developer settings and unknown sources. That is a user choice, and Google can change it at any time.

## Roadmap

- [x] Fullscreen browser, address bar, back/home
- [x] GPS-based Drive Mode with hysteresis
- [x] Video lock while driving
- [ ] Voice search and read-aloud (scaffolded in `MainActivity.kt`, needs device testing)
- [ ] Pinned road tiles
- [ ] Car App Library surface for Android Auto's official templates (only if a permitted category fits)
- [ ] Offline reader mode for long articles

## Status

Early scaffold. Not yet compiled against a device. Treat the first milestone as "it builds, opens a page, and switches to Drive Mode on a real drive."

## License

MIT
