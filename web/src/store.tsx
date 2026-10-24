import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { BUILTIN_APPS, TRACKS, type AppDef, type Route, type Track } from './data';
import { isNative, native } from './native';

export type Theme = 'dark' | 'light' | 'auto';
export type Accent = 'blue' | 'violet' | 'mint';
export type LaunchMode = 'browser' | 'newtab';

export interface Bookmark {
  title: string;
  url: string;
}

export interface Prefs {
  name: string;
  theme: Theme;
  accent: Accent;
  driveMode: boolean;
  pinned: string[];
  customApps: AppDef[];
  launch: Record<string, LaunchMode>;
  bookmarks: Bookmark[];
  recentUrls: string[];
  homeUrl: string;
  widgets: { weather: boolean; continueWatching: boolean; nowPlaying: boolean; recent: boolean };
  brightness: number;
  layout: 'split' | 'full';
  dnd: boolean;
  audioOutput: 'Car speakers' | 'Phone speaker' | 'Headphones';
  voiceSuggestions: boolean;
  navVoice: boolean;
  autoLaunch: boolean;
  notifications: boolean;
  analytics: boolean;
  favoriteTracks: string[];
  lastDestination: string;
}

export const DEFAULT_PREFS: Prefs = {
  lastDestination: '',
  name: 'Justin',
  theme: 'dark',
  accent: 'blue',
  driveMode: false,
  pinned: ['youtube', 'netflix', 'prime', 'disney', 'jio', 'spotify', 'chrome', 'maps'],
  customApps: [],
  launch: {},
  bookmarks: [],
  recentUrls: [],
  homeUrl: 'https://www.google.com',
  widgets: { weather: true, continueWatching: true, nowPlaying: true, recent: true },
  brightness: 100,
  layout: 'split',
  dnd: false,
  audioOutput: 'Car speakers',
  voiceSuggestions: true,
  navVoice: true,
  autoLaunch: false,
  notifications: true,
  analytics: false,
  favoriteTracks: [],
};

const STORAGE_KEY = 'glovebox.prefs.v1';

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Prefs>;
      return { ...DEFAULT_PREFS, ...parsed, widgets: { ...DEFAULT_PREFS.widgets, ...parsed.widgets } };
    }
  } catch {
    // Corrupt storage: fall back to defaults.
  }
  return DEFAULT_PREFS;
}

function readRoute(): Route {
  const r = window.location.hash.replace('#/', '') as Route;
  const valid: Route[] = ['home', 'browser', 'media', 'navigation', 'car', 'apps', 'settings', 'assistant'];
  return valid.includes(r) ? r : 'home';
}

export interface PlayerState {
  trackIndex: number;
  track: Track;
  playing: boolean;
  elapsed: number;
  volume: number;
  shuffle: boolean;
  repeat: boolean;
  toggle: () => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  seek: (sec: number) => void;
  playTrack: (index: number) => void;
  setVolume: (v: number) => void;
  setShuffle: (v: boolean) => void;
  setRepeat: (v: boolean) => void;
}

export interface AppState {
  prefs: Prefs;
  setPrefs: (patch: Partial<Prefs>) => void;
  setDriveMode: (on: boolean) => void;
  resetPrefs: () => void;
  allApps: AppDef[];
  route: Route;
  go: (route: Route) => void;
  browserTarget: { url: string; n: number };
  openUrl: (url: string) => void;
  launch: (app: AppDef) => void;
  player: PlayerState;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<Prefs>(loadPrefs);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Storage full or unavailable: keep running without persistence.
    }
  }, [prefs]);

  const setPrefs = useCallback((patch: Partial<Prefs>) => setPrefsState((p) => ({ ...p, ...patch })), []);
  const resetPrefs = useCallback(() => setPrefsState(DEFAULT_PREFS), []);
  // Drive Mode is always the user's choice. Inside the app, the native side stores it too,
  // so the video lock and the browser follow the same switch.
  const setDriveMode = useCallback((on: boolean) => {
    setPrefsState((p) => ({ ...p, driveMode: on }));
    if (isNative) native?.setDriveMode(on);
  }, []);
  const allApps = useMemo(() => [...BUILTIN_APPS, ...prefs.customApps], [prefs.customApps]);

  // Route lives in the hash so the browser's back button and deep links work.
  const [route, setRoute] = useState<Route>(readRoute);
  useEffect(() => {
    const onHash = () => setRoute(readRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const go = useCallback((r: Route) => {
    // Inside the Android app, browsing happens in the native browser so sites that block
    // iframes still load, and video lock can be enforced.
    if (r === 'browser' && isNative) {
      native?.showBrowser(prefs.homeUrl);
      return;
    }
    window.location.hash = `/${r}`;
    setRoute(r);
  }, [prefs.homeUrl]);

  // The Android app reports its saved Drive Mode state when a page loads.
  useEffect(() => {
    window.gloveboxSetDriving = (driving: boolean) => setPrefsState((p) => ({ ...p, driveMode: driving }));
    return () => {
      delete window.gloveboxSetDriving;
    };
  }, []);

  const [browserTarget, setBrowserTarget] = useState<{ url: string; n: number }>({ url: prefs.homeUrl, n: 0 });
  const openUrl = useCallback(
    (url: string) => {
      setBrowserTarget((t) => ({ url, n: t.n + 1 }));
      setPrefsState((p) => ({ ...p, recentUrls: [url, ...p.recentUrls.filter((u) => u !== url)].slice(0, 8) }));
      if (isNative) {
        native?.openUrl(url);
        return;
      }
      go('browser');
    },
    [go],
  );

  const launch = useCallback(
    (app: AppDef) => {
      if (app.route) {
        go(app.route);
      } else if (app.url) {
        const mode = prefs.launch[app.id] ?? 'browser';
        if (mode === 'newtab' && !isNative) {
          window.open(app.url, '_blank', 'noopener,noreferrer');
        } else {
          openUrl(app.url);
        }
      }
    },
    [go, openUrl, prefs.launch],
  );

  // ----- Player (simulated playback: no audio file is bundled) -----
  const [trackIndex, setTrackIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [volume, setVolume] = useState(60);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const track = TRACKS[trackIndex];

  const playTrack = useCallback((index: number) => {
    setTrackIndex(index);
    setElapsed(0);
    setPlaying(true);
  }, []);

  const next = useCallback(() => {
    setElapsed(0);
    setTrackIndex((i) => {
      if (shuffle) {
        let n = Math.floor(Math.random() * TRACKS.length);
        if (n === i) n = (n + 1) % TRACKS.length;
        return n;
      }
      return (i + 1) % TRACKS.length;
    });
  }, [shuffle]);

  // Previous restarts the current track if it has played for a few seconds.
  const prev = useCallback(() => {
    if (elapsed > 3) {
      setElapsed(0);
      return;
    }
    setElapsed(0);
    setTrackIndex((i) => (i - 1 + TRACKS.length) % TRACKS.length);
  }, [elapsed]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, [playing]);

  useEffect(() => {
    if (playing && elapsed >= track.seconds) {
      if (repeat) setElapsed(0);
      else next();
    }
  }, [elapsed, playing, track.seconds, repeat, next]);

  const player: PlayerState = {
    trackIndex,
    track,
    playing,
    elapsed,
    volume,
    shuffle,
    repeat,
    toggle: () => setPlaying((p) => !p),
    play: () => setPlaying(true),
    pause: () => setPlaying(false),
    next,
    prev,
    seek: (sec) => setElapsed(Math.max(0, Math.min(track.seconds, sec))),
    playTrack,
    setVolume,
    setShuffle,
    setRepeat,
  };

  const value: AppState = {
    prefs,
    setPrefs,
    setDriveMode,
    resetPrefs,
    allApps,
    route,
    go,
    browserTarget,
    openUrl,
    launch,
    player,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside AppProvider');
  return v;
}
