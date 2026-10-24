import { useEffect, useState } from 'react';
import { Car, Globe, Home, LayoutGrid, Mic, Music, Navigation, Settings, Smartphone, BatteryMedium, Wifi, User } from 'lucide-react';
import { useApp } from '../store';
import type { Route } from '../data';
import { Logo } from './Primitives';

export function useNow(intervalMs = 15000): Date {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

function useOnline(): boolean {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

const RAIL: { route: Route; label: string; Icon: typeof Home }[] = [
  { route: 'home', label: 'Home', Icon: Home },
  { route: 'browser', label: 'Browser', Icon: Globe },
  { route: 'media', label: 'Media', Icon: Music },
  { route: 'navigation', label: 'Navigation', Icon: Navigation },
  { route: 'car', label: 'Car', Icon: Car },
  { route: 'apps', label: 'Apps', Icon: LayoutGrid },
  { route: 'settings', label: 'Settings', Icon: Settings },
];

export function Rail() {
  const { route, go, prefs } = useApp();
  return (
    <nav className="rail" aria-label="Main navigation">
      {RAIL.map(({ route: r, label, Icon }) => {
        const disabled = prefs.driveMode && r === 'browser';
        return (
          <button
            key={r}
            type="button"
            className={`rail-item ${route === r ? 'active' : ''}`}
            onClick={() => go(r)}
            aria-current={route === r ? 'page' : undefined}
            title={disabled ? 'Browser is available when parked' : label}
          >
            <Icon size={24} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function TopBar() {
  const { prefs, setDriveMode, go } = useApp();
  const now = useNow();
  const online = useOnline();
  const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return (
    <header className="topbar">
      <div className="brand">
        <Logo size={34} />
        <span>GloveBox</span>
      </div>
      <div className="spacer" />
      <button
        type="button"
        className={`chip ${prefs.driveMode ? 'active' : ''}`}
        onClick={() => setDriveMode(!prefs.driveMode)}
        aria-pressed={prefs.driveMode}
        title="Turn Drive Mode on or off yourself"
      >
        {prefs.driveMode ? 'Drive Mode on' : 'Drive Mode off'}
      </button>
      <div className="status" aria-label="Status">
        <span className="time">{time}</span>
        <span className="hide-small" title={online ? 'Internet reachable' : 'Offline'}>
          <Wifi size={18} className={online ? 'ok' : ''} />
        </span>
        <span className="hide-small" title="Phone connection (simulated)">
          <Smartphone size={18} />
        </span>
        <span className="hide-small" title="Battery (simulated)">
          <BatteryMedium size={18} /> 84%
        </span>
      </div>
      <button type="button" className="btn icon ghost" onClick={() => go('assistant')} aria-label="Open GloveBox assistant" title="Assistant">
        <Mic size={22} />
      </button>
      <button type="button" className="btn icon ghost" onClick={() => go('settings')} aria-label={`Profile: ${prefs.name}`} title="Settings">
        <span className="mark sm" style={{ background: 'linear-gradient(160deg,#1687ff,#703bff)' }}>
          {prefs.name.slice(0, 1).toUpperCase() || <User size={18} />}
        </span>
      </button>
    </header>
  );
}
