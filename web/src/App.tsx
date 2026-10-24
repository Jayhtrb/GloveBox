import { useEffect } from 'react';
import { useApp } from './store';
import { Rail, TopBar } from './components/Shell';
import Home from './screens/Home';
import Browser from './screens/Browser';
import Media from './screens/Media';
import Navigation from './screens/Navigation';
import AppLibrary from './screens/AppLibrary';
import Car from './screens/Car';
import Settings from './screens/Settings';
import Assistant from './screens/Assistant';

export default function App() {
  const { prefs, route } = useApp();

  // Apply theme, accent, and brightness to the document root.
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const apply = () => {
      const resolved = prefs.theme === 'auto' ? (media.matches ? 'light' : 'dark') : prefs.theme;
      root.dataset.theme = resolved;
    };
    apply();
    root.dataset.accent = prefs.accent;
    root.style.setProperty('--brightness', String(prefs.brightness / 100));
    if (prefs.theme === 'auto') {
      media.addEventListener('change', apply);
      return () => media.removeEventListener('change', apply);
    }
    return undefined;
  }, [prefs.theme, prefs.accent, prefs.brightness]);

  let screen;
  switch (route) {
    case 'browser':
      screen = <Browser />;
      break;
    case 'media':
      screen = <Media />;
      break;
    case 'navigation':
      screen = <Navigation />;
      break;
    case 'car':
      screen = <Car />;
      break;
    case 'apps':
      screen = <AppLibrary />;
      break;
    case 'settings':
      screen = <Settings />;
      break;
    case 'assistant':
      screen = <Assistant />;
      break;
    default:
      screen = <Home />;
  }

  return (
    <div className={`app ${prefs.driveMode ? 'drive' : ''}`}>
      <Rail />
      <div className="main">
        <TopBar />
        <main className="content" id="main">
          {prefs.driveMode && (
            <div className="drive-banner" role="status">
              Drive Mode: video and browsing are locked. Voice, music, navigation, and apps stay available.
            </div>
          )}
          {screen}
        </main>
      </div>
    </div>
  );
}
