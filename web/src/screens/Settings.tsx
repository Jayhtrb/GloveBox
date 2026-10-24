import { useState } from 'react';
import { Bell, Eye, Info, LayoutGrid, Music, Palette, RotateCcw, Globe, Mic, Wifi, Lock } from 'lucide-react';
import { useApp, type Accent, type Prefs, type Theme } from '../store';
import { Modal, Pill, Toggle } from '../components/Primitives';

type Section = 'appearance' | 'home' | 'apps' | 'browser' | 'audio' | 'voice' | 'connectivity' | 'notifications' | 'privacy' | 'permissions' | 'about';

const SECTIONS: { id: Section; label: string; Icon: typeof Palette }[] = [
  { id: 'appearance', label: 'Appearance', Icon: Palette },
  { id: 'home', label: 'Home screen', Icon: LayoutGrid },
  { id: 'apps', label: 'App management', Icon: LayoutGrid },
  { id: 'browser', label: 'Browser', Icon: Globe },
  { id: 'audio', label: 'Audio', Icon: Music },
  { id: 'voice', label: 'Voice assistant', Icon: Mic },
  { id: 'connectivity', label: 'Connectivity', Icon: Wifi },
  { id: 'notifications', label: 'Notifications', Icon: Bell },
  { id: 'privacy', label: 'Privacy', Icon: Eye },
  { id: 'permissions', label: 'Permissions', Icon: Lock },
  { id: 'about', label: 'About GloveBox', Icon: Info },
];

const ACCENTS: { id: Accent; label: string; color: string }[] = [
  { id: 'blue', label: 'Electric blue', color: '#1687ff' },
  { id: 'violet', label: 'Luminous violet', color: '#703bff' },
  { id: 'mint', label: 'Mint', color: '#20c997' },
];

export default function Settings() {
  const { prefs, setPrefs, resetPrefs, go } = useApp();
  const [section, setSection] = useState<Section>('appearance');
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const toggleWidget = (key: keyof typeof prefs.widgets, v: boolean) => setPrefs({ widgets: { ...prefs.widgets, [key]: v } });

  return (
    <div className="settings-grid">
      <nav className="card" style={{ padding: 10, alignSelf: 'start' }} aria-label="Settings sections">
        <ul className="list">
          {SECTIONS.map(({ id, label, Icon }) => (
            <li key={id}>
              <button
                type="button"
                className={`list-btn ${section === id ? 'active' : ''}`}
                style={section === id ? { background: 'linear-gradient(160deg, var(--accent), var(--accent-2))', color: '#fff', borderColor: 'transparent' } : undefined}
                onClick={() => setSection(id)}
                aria-current={section === id}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="stack" style={{ gap: 16 }}>
        {section === 'appearance' && (
          <section className="card">
            <h2>Appearance</h2>
            <div className="field-row">
              <div>
                <div>Name shown in greeting</div>
                <div className="small muted">Stored on this device only</div>
              </div>
              <input className="input" style={{ maxWidth: 240 }} value={prefs.name} onChange={(e) => setPrefs({ name: e.target.value.slice(0, 30) })} aria-label="Name" />
            </div>
            <div className="field-row">
              <span>Theme</span>
              <div className="tabs" role="group" aria-label="Theme">
                {(['dark', 'light', 'auto'] as Theme[]).map((t) => (
                  <button key={t} type="button" className={`chip ${prefs.theme === t ? 'active' : ''}`} onClick={() => setPrefs({ theme: t })} aria-pressed={prefs.theme === t}>
                    {t === 'dark' ? 'Night' : t === 'light' ? 'Day' : 'Automatic'}
                  </button>
                ))}
              </div>
            </div>
            <div className="field-row" style={{ alignItems: 'flex-start' }}>
              <span>Accent color</span>
              <div className="row wrap" role="group" aria-label="Accent color">
                {ACCENTS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className={`swatch ${prefs.accent === a.id ? 'on' : ''}`}
                    style={{ ['--sw' as string]: a.color }}
                    onClick={() => setPrefs({ accent: a.id })}
                    aria-label={a.label}
                    aria-pressed={prefs.accent === a.id}
                    title={a.label}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {section === 'home' && (
          <section className="card">
            <h2>Home screen</h2>
            {(
              [
                ['weather', 'Weather card (simulated values)'],
                ['continueWatching', 'Continue Watching'],
                ['nowPlaying', 'Now Playing'],
                ['recent', 'Recently Visited'],
              ] as const
            ).map(([key, label]) => (
              <div className="field-row" key={key}>
                <span>{label}</span>
                <Toggle checked={prefs.widgets[key]} onChange={(v) => toggleWidget(key, v)} label={label} />
              </div>
            ))}
            <p className="muted small">Navigation and the favorite app dock always show on Home.</p>
          </section>
        )}

        {section === 'apps' && (
          <section className="card">
            <h2>App management</h2>
            <p className="muted">You have {prefs.pinned.length} pinned apps and {prefs.customApps.length} custom web apps.</p>
            <button type="button" className="btn primary" onClick={() => go('apps')}>
              Open App Library
            </button>
          </section>
        )}

        {section === 'browser' && (
          <section className="card">
            <h2>Browser</h2>
            <label className="field-row">
              <span>Home page</span>
              <input className="input" style={{ maxWidth: 320 }} value={prefs.homeUrl} onChange={(e) => setPrefs({ homeUrl: e.target.value })} aria-label="Browser home page" inputMode="url" autoCapitalize="none" />
            </label>
            <div className="field-row">
              <span>Bookmarks</span>
              <div className="row">
                <span className="muted small">{prefs.bookmarks.length} saved</span>
                <button type="button" className="btn" disabled={prefs.bookmarks.length === 0} onClick={() => setPrefs({ bookmarks: [] })}>
                  Clear
                </button>
              </div>
            </div>
            <div className="field-row">
              <span>Recent pages</span>
              <div className="row">
                <span className="muted small">{prefs.recentUrls.length} saved</span>
                <button type="button" className="btn" disabled={prefs.recentUrls.length === 0} onClick={() => setPrefs({ recentUrls: [] })}>
                  Clear
                </button>
              </div>
            </div>
            <p className="muted small">Some websites block being shown inside other apps. GloveBox shows an Open in new tab option when that happens.</p>
          </section>
        )}

        {section === 'audio' && (
          <section className="card">
            <h2>Audio</h2>
            <div className="field-row">
              <span>Output</span>
              <select className="input" style={{ maxWidth: 220 }} value={prefs.audioOutput} onChange={(e) => setPrefs({ audioOutput: e.target.value as Prefs['audioOutput'] })} aria-label="Audio output">
                <option>Car speakers</option>
                <option>Phone speaker</option>
                <option>Headphones</option>
              </select>
            </div>
            <p className="muted small">Playback here is simulated. Real playback needs a licensed audio source.</p>
          </section>
        )}

        {section === 'voice' && (
          <section className="card">
            <h2>Voice assistant</h2>
            <div className="field-row">
              <span>Suggested commands</span>
              <Toggle checked={prefs.voiceSuggestions} onChange={(v) => setPrefs({ voiceSuggestions: v })} label="Suggested commands" />
            </div>
            <div className="field-row">
              <span>Voice guidance in navigation</span>
              <Toggle checked={prefs.navVoice} onChange={(v) => setPrefs({ navVoice: v })} label="Voice guidance" />
            </div>
            <p className="muted small">
              The assistant runs local commands only. No AI provider is connected in this build.
            </p>
          </section>
        )}

        {section === 'connectivity' && (
          <section className="card">
            <h2>Connectivity</h2>
            <div className="field-row">
              <span>Phone</span>
              <Pill kind="sim">Simulated</Pill>
            </div>
            <div className="field-row">
              <span>Android Auto</span>
              <Pill kind="warn">Needs the Android app</Pill>
            </div>
            <button type="button" className="btn" onClick={() => go('car')}>
              Open Car &amp; Connectivity
            </button>
          </section>
        )}

        {section === 'notifications' && (
          <section className="card">
            <h2>Notifications</h2>
            <div className="field-row">
              <div>
                <div>Show notifications</div>
                <div className="small muted">Off during Do Not Disturb</div>
              </div>
              <Toggle checked={prefs.notifications} onChange={(v) => setPrefs({ notifications: v })} label="Show notifications" />
            </div>
          </section>
        )}

        {section === 'privacy' && (
          <section className="card">
            <h2>Privacy</h2>
            <div className="field-row">
              <div>
                <div>Share anonymous usage</div>
                <div className="small muted">Off by default. Nothing is sent in this prototype.</div>
              </div>
              <Toggle checked={prefs.analytics} onChange={(v) => setPrefs({ analytics: v })} label="Share anonymous usage" />
            </div>
            <div className="field-row">
              <div>
                <div>Clear local data</div>
                <div className="small muted">Removes preferences, bookmarks, pins, and history on this device</div>
              </div>
              <button type="button" className="btn danger" onClick={() => setConfirmClear(true)}>
                Clear
              </button>
            </div>
          </section>
        )}

        {section === 'permissions' && (
          <section className="card">
            <h2>Permissions</h2>
            <ul className="list small">
              <li><span className="grow"><b>Location</b>: Drive Mode in the Android app. Not used by the web prototype.</span></li>
              <li><span className="grow"><b>Microphone</b>: voice commands through the browser, if allowed.</span></li>
              <li><span className="grow"><b>Notifications</b>: Android Drive Mode service.</span></li>
            </ul>
          </section>
        )}

        {section === 'about' && (
          <section className="card">
            <h2>About GloveBox</h2>
            <p className="muted" style={{ marginTop: 0 }}>All your apps. On the road.</p>
            <div className="field-row"><span>Version</span><span className="muted">0.1.0 prototype</span></div>
            <div className="field-row"><span>License</span><span className="muted">MIT</span></div>
            <p className="muted small">
              GloveBox is an independent prototype. It isn't affiliated with any streaming service, map provider, or vehicle maker. Logos are not used; app tiles are monograms.
            </p>
          </section>
        )}

        <section className="card">
          <div className="row wrap" style={{ justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 620 }}>Reset to defaults</div>
              <div className="small muted">Restores every setting, pin, and bookmark to the first-run state.</div>
            </div>
            <button type="button" className="btn danger" onClick={() => setConfirmReset(true)}>
              <RotateCcw size={18} /> Reset
            </button>
          </div>
        </section>
      </div>

      {confirmReset && (
        <Modal title="Reset GloveBox?" onClose={() => setConfirmReset(false)}>
          <p className="muted">This clears your pins, bookmarks, custom apps, and preferences on this device.</p>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn danger"
              onClick={() => {
                resetPrefs();
                setConfirmReset(false);
              }}
            >
              Reset
            </button>
          </div>
        </Modal>
      )}

      {confirmClear && (
        <Modal title="Clear local data?" onClose={() => setConfirmClear(false)}>
          <p className="muted">This removes preferences, bookmarks, pins, and history from this device. It can't be undone.</p>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={() => setConfirmClear(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn danger"
              onClick={() => {
                resetPrefs();
                setConfirmClear(false);
              }}
            >
              Clear data
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
