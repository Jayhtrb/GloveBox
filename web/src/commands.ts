import { PLACES, type AppDef, type Route } from './data';
import type { Theme } from './store';

/**
 * Local command interpreter for the GloveBox assistant.
 * It only runs supported local actions. There is no live AI provider connected.
 */
export interface CommandContext {
  apps: AppDef[];
  pinned: AppDef[];
  driveMode: boolean;
  go: (route: Route) => void;
  openUrl: (url: string) => void;
  launch: (app: AppDef) => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  setTheme: (t: Theme) => void;
  navigateTo: (place: string) => void;
  playlistName: string;
}

export interface CommandResult {
  reply: string;
  handled: boolean;
}

function findApp(query: string, apps: AppDef[]): AppDef | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return apps.find((a) => a.name.toLowerCase() === q) ?? apps.find((a) => a.name.toLowerCase().includes(q) || q.includes(a.name.toLowerCase()));
}

export function runCommand(raw: string, ctx: CommandContext): CommandResult {
  const text = raw.trim().toLowerCase().replace(/[?.!]+$/, '');
  const ok = (reply: string): CommandResult => ({ reply, handled: true });
  const no = (reply: string): CommandResult => ({ reply, handled: false });

  if (!text) return no('Say or type a command to begin.');

  if (/^(what can you do|help|commands)/.test(text)) {
    return ok('I can open apps and saved web apps, play or pause music, switch day and night mode, search demo places, and show the weather. Try a suggested command below.');
  }

  if (/\bvideo\b|\bmovie\b|\bshow\b.*\bepisode\b/.test(text) && ctx.driveMode) {
    return ok('Video is unavailable while driving. Ask me to play music or navigate instead.');
  }

  if (/^(pause|stop)( the)?( music| song| playback)?$/.test(text)) {
    ctx.pause();
    return ok('Paused.');
  }
  if (/^(play|resume)( the)?( music| song)?$|^play (my )?(favorite|favourite) playlist$|^play my playlist$/.test(text)) {
    ctx.play();
    return ok(`Playing ${ctx.playlistName} (simulated playback).`);
  }
  if (/^next( song| track)?$|^skip( song| track)?$/.test(text)) {
    ctx.next();
    return ok('Skipped to the next track.');
  }

  const openMatch = text.match(/^open (.+)$/);
  if (openMatch) {
    const target = openMatch[1];
    if (target.includes('saved web app') || target.includes('web app')) {
      ctx.go('apps');
      return ok('Opened your app library, where your saved web apps are listed.');
    }
    const app = findApp(target, ctx.apps);
    if (app) {
      if (ctx.driveMode && app.url) {
        return ok(`${app.name} opens in the browser, which is available when parked.`);
      }
      ctx.launch(app);
      return ok(`Opening ${app.name}.`);
    }
    return no(`I couldn't find an app called "${target}". Check the app library for its exact name.`);
  }

  const navMatch = text.match(/^(?:navigate to|directions to|take me to|go to) (.+)$/);
  if (navMatch) {
    const place = PLACES.find((p) => p.name.toLowerCase() === navMatch[1] || p.name.toLowerCase().includes(navMatch[1]));
    if (place) {
      ctx.navigateTo(place.name);
      return ok(`Showing a simulated route to ${place.name}. Live directions are not connected in this demo.`);
    }
    return no(`I don't have "${navMatch[1]}" in the demo places. Try one of: ${PLACES.map((p) => p.name).join(', ')}.`);
  }

  if (/coffee|cafe|café/.test(text) && /find|nearby|near|search/.test(text)) {
    const cafe = PLACES[0];
    ctx.navigateTo(cafe.name);
    return ok(`Simulated result: ${cafe.name}, about ${cafe.km} km away. This is demo data, not a live search.`);
  }

  if (/night mode|dark mode/.test(text)) {
    ctx.setTheme('dark');
    return ok('Night mode is on.');
  }
  if (/day mode|light mode|daytime/.test(text)) {
    ctx.setTheme('light');
    return ok('Day mode is on.');
  }

  if (/saved web apps?|my web apps?|web apps/.test(text)) {
    ctx.go('apps');
    return ok('Here are your apps. Web shortcuts open in the GloveBox browser.');
  }

  if (/open maps|maps$/.test(text)) {
    const maps = ctx.apps.find((a) => a.id === 'maps');
    if (maps) ctx.launch(maps);
    return ok('Opening Maps.');
  }

  if (/recent apps|pinned apps|my apps/.test(text)) {
    const names = ctx.pinned.map((a) => a.name).join(', ');
    return ok(`Your pinned apps: ${names || 'none yet'}.`);
  }

  if (/weather/.test(text)) {
    return ok('Simulated weather: 28°C in Hyderabad, mostly sunny. Live weather is not connected in this demo.');
  }

  if (/traffic/.test(text)) {
    return ok('Live traffic is not connected in this demo, so I can\'t report it.');
  }

  if (/^(what time|time)/.test(text)) {
    return ok(`It's ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`);
  }

  return no("I can't do that yet. Try one of the suggested commands below.");
}
