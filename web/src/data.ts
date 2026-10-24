// Demo data only. Every title, place, and track here is fictional or simulated.
// No streaming service content, logos, or live data are used.

export type Route = 'home' | 'browser' | 'media' | 'navigation' | 'car' | 'apps' | 'settings' | 'assistant';

export type Category =
  | 'Entertainment'
  | 'Music'
  | 'Navigation'
  | 'Communication'
  | 'Productivity'
  | 'Utilities'
  | 'Vehicle';

export const CATEGORIES: Category[] = [
  'Entertainment',
  'Music',
  'Navigation',
  'Communication',
  'Productivity',
  'Utilities',
  'Vehicle',
];

export interface AppDef {
  id: string;
  name: string;
  category: Category;
  /** Short text monogram used instead of a third-party logo. */
  mark: string;
  color: string;
  /** Web destination. Opened in the GloveBox browser, never embedded by default. */
  url?: string;
  /** In-app screen destination. */
  route?: Route;
  note: string;
}

export const BUILTIN_APPS: AppDef[] = [
  { id: 'youtube', name: 'YouTube', category: 'Entertainment', mark: 'YT', color: '#c4302b', url: 'https://www.youtube.com', note: 'Opens the YouTube website. Playback is controlled by the site and is limited while driving.' },
  { id: 'netflix', name: 'Netflix', category: 'Entertainment', mark: 'NF', color: '#8a0f16', url: 'https://www.netflix.com', note: 'Opens the Netflix website. Sign-in and DRM playback are handled by Netflix; GloveBox does not embed it.' },
  { id: 'prime', name: 'Prime Video', category: 'Entertainment', mark: 'PV', color: '#1b4f8f', url: 'https://www.primevideo.com', note: 'Opens the Prime Video website. Not embedded.' },
  { id: 'disney', name: 'Disney+', category: 'Entertainment', mark: 'D+', color: '#0c2f7a', url: 'https://www.disneyplus.com', note: 'Opens the Disney+ website. Not embedded.' },
  { id: 'jio', name: 'JioHotstar', category: 'Entertainment', mark: 'JH', color: '#5b2bd6', url: 'https://www.hotstar.com', note: 'Opens the JioHotstar website. Not embedded.' },
  { id: 'spotify', name: 'Spotify', category: 'Music', mark: 'SP', color: '#1a9d4a', url: 'https://open.spotify.com', note: 'Opens Spotify Web. The native Spotify app is a separate media app.' },
  { id: 'chrome', name: 'Chrome', category: 'Utilities', mark: 'CH', color: '#3b78e7', url: 'https://www.google.com', note: 'Opens the GloveBox built-in browser at Google.' },
  { id: 'maps', name: 'Maps', category: 'Navigation', mark: 'MP', color: '#2f9e5b', route: 'navigation', note: 'Opens the GloveBox navigation demo. The map is simulated; it does not give live directions.' },
  { id: 'gmail', name: 'Gmail', category: 'Communication', mark: 'GM', color: '#d93025', url: 'https://mail.google.com', note: 'Opens the Gmail website. Google handles sign-in in the browser.' },
];

export interface Track {
  title: string;
  artist: string;
  seconds: number;
  from: string;
  to: string;
}

export const TRACKS: Track[] = [
  { title: 'Night Drive Theme', artist: 'Demo Artist A', seconds: 200, from: '#c8102e', to: '#2a0710' },
  { title: 'Neon Harbor', artist: 'Mira Vale', seconds: 205, from: '#1687ff', to: '#703bff' },
  { title: 'Paper Skyline', artist: 'The Lantern Club', seconds: 232, from: '#ff6a3d', to: '#8a1c3c' },
  { title: 'Slow Orbit', artist: 'Ada Lumen', seconds: 188, from: '#2bd1a0', to: '#0e4f6e' },
  { title: 'Midnight Relay', artist: 'Kai Ferro', seconds: 246, from: '#f5c542', to: '#7a3b10' },
];

export interface Show {
  title: string;
  episode: string;
  minutesLeft: number;
  from: string;
  to: string;
  synopsis: string;
}

export const SHOWS: Show[] = [
  { title: 'Midnight Circuit', episode: 'S2 E3', minutesLeft: 45, from: '#1b2a4a', to: '#05070b', synopsis: 'Placeholder episode. A fictional thriller about a city that never sleeps.' },
  { title: 'Signal Fires', episode: 'S1 E6', minutesLeft: 22, from: '#3a1d5c', to: '#0a0614', synopsis: 'Placeholder episode. A fictional drama about a village on a hill.' },
  { title: 'Harbor Lights', episode: 'S3 E1', minutesLeft: 58, from: '#0f4c5c', to: '#041017', synopsis: 'Placeholder episode. A fictional comedy set on a ferry route.' },
  { title: 'Iron Orchard', episode: 'Ep 12', minutesLeft: 31, from: '#5c3d12', to: '#100a04', synopsis: 'Placeholder episode. A fictional documentary about farming in the future.' },
  { title: 'Glass Horizon', episode: 'S1 E2', minutesLeft: 40, from: '#1d4f2c', to: '#06120a', synopsis: 'Placeholder episode. A fictional sci-fi series.' },
];

export const PLACES = [
  { name: 'Cafe Aurora', km: 1.2 },
  { name: 'Central Market', km: 3.4 },
  { name: 'Hilltop Station', km: 6.8 },
  { name: 'Riverside Office', km: 9.1 },
  { name: 'Lakeview Park', km: 12.5 },
];

export const COMMAND_SUGGESTIONS = [
  'Play my favorite playlist',
  'Open Maps',
  'Find a coffee shop nearby',
  'Pause the music',
  'Show my saved web apps',
  'Switch to night mode',
  'Navigate to Lakeview Park',
  'What can you do?',
];
