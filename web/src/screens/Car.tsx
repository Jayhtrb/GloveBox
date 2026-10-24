import { BellOff, Bluetooth, MonitorSmartphone, Moon, Shield, Smartphone, Sun, Volume2 } from 'lucide-react';
import { useApp, type Prefs } from '../store';
import { Pill, Toggle } from '../components/Primitives';

export default function Car() {
  const { prefs, setPrefs, setDriveMode } = useApp();

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 28, letterSpacing: '-0.4px' }}>Car &amp; Connectivity</h1>
        <p className="muted small" style={{ margin: '6px 0 0' }}>
          Preferences for this display. Values marked "demo" are simulated until the Android app connects to a vehicle.
        </p>
      </div>

      <div className="section-grid">
        <section className="card" aria-label="Phone connection">
          <h3>
            <Smartphone size={18} style={{ verticalAlign: 'text-bottom' }} /> Phone connection
          </h3>
          <div className="field-row">
            <span>Phone link</span>
            <Pill kind="sim">Connected · demo</Pill>
          </div>
          <div className="field-row">
            <span>Bluetooth</span>
            <Pill kind="sim">Demo value</Pill>
          </div>
        </section>

        <section className="card" aria-label="Android Auto status">
          <h3>
            <MonitorSmartphone size={18} style={{ verticalAlign: 'text-bottom' }} /> Android Auto
          </h3>
          <div className="field-row">
            <span>Status</span>
            <Pill kind="warn">Not connected · web prototype</Pill>
          </div>
          <p className="muted small" style={{ marginBottom: 0 }}>
            This web prototype can't run on the car's display. The Android app is required for wired or wireless Android Auto, and only supported app categories appear there.
          </p>
        </section>

        <section className="card" aria-label="Display">
          <h3>
            <Sun size={18} style={{ verticalAlign: 'text-bottom' }} /> Display
          </h3>
          <label className="stack" style={{ gap: 8 }}>
            <span className="row" style={{ justifyContent: 'space-between' }}>
              <span>Brightness</span>
              <span className="muted">{prefs.brightness}%</span>
            </span>
            <input className="slider" type="range" min={60} max={100} value={prefs.brightness} onChange={(e) => setPrefs({ brightness: Number(e.target.value) })} aria-label="Screen brightness" />
          </label>
          <div className="field-row">
            <span>Layout</span>
            <select className="input" style={{ maxWidth: 220 }} value={prefs.layout} onChange={(e) => setPrefs({ layout: e.target.value as 'split' | 'full' })} aria-label="Display layout">
              <option value="split">Split (rail + content)</option>
              <option value="full">Full content</option>
            </select>
          </div>
          <div className="field-row">
            <span>Theme</span>
            <select className="input" style={{ maxWidth: 220 }} value={prefs.theme} onChange={(e) => setPrefs({ theme: e.target.value as 'dark' | 'light' | 'auto' })} aria-label="Theme">
              <option value="dark">Night (dark)</option>
              <option value="light">Day (light)</option>
              <option value="auto">Automatic</option>
            </select>
          </div>
        </section>

        <section className="card" aria-label="Audio output">
          <h3>
            <Volume2 size={18} style={{ verticalAlign: 'text-bottom' }} /> Audio output
          </h3>
          <div className="field-row">
            <span>Output</span>
            <select className="input" style={{ maxWidth: 220 }} value={prefs.audioOutput} onChange={(e) => setPrefs({ audioOutput: e.target.value as Prefs['audioOutput'] })} aria-label="Audio output">
              <option>Car speakers</option>
              <option>Phone speaker</option>
              <option>Headphones</option>
            </select>
          </div>
          <p className="muted small" style={{ marginBottom: 0 }}>
            The choice is saved here. Routing to vehicle speakers needs the Android audio integration.
          </p>
        </section>

        <section className="card" aria-label="Voice assistant">
          <h3>
            <Bluetooth size={18} style={{ verticalAlign: 'text-bottom' }} /> Voice assistant
          </h3>
          <div className="field-row">
            <div>
              <div>Show suggested commands</div>
              <div className="small muted">Chips under the assistant</div>
            </div>
            <Toggle checked={prefs.voiceSuggestions} onChange={(v) => setPrefs({ voiceSuggestions: v })} label="Show suggested commands" />
          </div>
        </section>

        <section className="card" aria-label="Driving and interruptions">
          <h3>
            <Shield size={18} style={{ verticalAlign: 'text-bottom' }} /> Driving
          </h3>
          <div className="field-row">
            <div>
              <div>Drive Mode</div>
              <div className="small muted">You turn it on and off. Nothing switches it for you.</div>
            </div>
            <Toggle checked={prefs.driveMode} onChange={(v) => setDriveMode(v)} label="Drive Mode" />
          </div>
          <div className="field-row">
            <div>
              <div>Automatic launch</div>
              <div className="small muted">Open GloveBox when the car connects (Android only)</div>
            </div>
            <Toggle checked={prefs.autoLaunch} onChange={(v) => setPrefs({ autoLaunch: v })} label="Automatic launch" />
          </div>
          <div className="field-row">
            <div>
              <div className="row"><BellOff size={16} /> Do Not Disturb</div>
              <div className="small muted">Silences GloveBox notifications</div>
            </div>
            <Toggle checked={prefs.dnd} onChange={(v) => setPrefs({ dnd: v })} label="Do Not Disturb" />
          </div>
        </section>

        <section className="card" aria-label="App permissions">
          <h3>Permissions</h3>
          <ul className="list small">
            <li><span className="grow"><b>Location</b>: not used. GloveBox doesn't read your speed.</span></li>
            <li><span className="grow"><b>Microphone</b>: voice commands, if your browser allows speech input.</span></li>
          </ul>
        </section>
      </div>

      <div className="notice">
        <Moon size={18} style={{ flex: 'none', marginTop: 2 }} />
        <span>
          GloveBox doesn't control vehicle hardware, climate, steering, or safety systems. Those need an authorized manufacturer integration, which this app doesn't have.
        </span>
      </div>
    </div>
  );
}
