import { useMemo, useState } from 'react';
import { CornerUpRight, Heart, Mic, Pause, Play, Search, Star } from 'lucide-react';
import { useApp } from '../store';
import { PLACES } from '../data';
import { Pill, Toggle } from '../components/Primitives';
import { RouteMap, useDemoProgress } from '../components/RouteMap';
import { fmtTime } from '../format';

const FAVORITE_PLACES = ['Riverside Office', 'Cafe Aurora'];
const ROUTE_NAMES = ['Main route', 'Alternative 1', 'Alternative 2'];
const ROUTE_TIMES = [32, 36, 41];
const ROUTE_KM = [18, 16.4, 21.2];

export default function Navigation() {
  const { prefs, setPrefs, player, go } = useApp();
  const [query, setQuery] = useState('');
  const [dest, setDest] = useState<string>(prefs.lastDestination);
  const [alt, setAlt] = useState(0);
  const [recent, setRecent] = useState<string[]>(['Lakeview Park']);
  const progress = useDemoProgress(90, !dest);

  const results = useMemo(
    () => PLACES.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase())),
    [query],
  );

  const choose = (name: string) => {
    setDest(name);
    setAlt(0);
    setRecent((r) => [name, ...r.filter((x) => x !== name)].slice(0, 4));
    setPrefs({ lastDestination: name });
  };

  const remainingMin = Math.max(1, Math.round(ROUTE_TIMES[alt] * (1 - progress)));
  const remainingKm = (ROUTE_KM[alt] * (1 - progress)).toFixed(1);
  const arrival = new Date(Date.now() + remainingMin * 60000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="nav-grid">
      <div className="stack">
        <div className="map-frame">
          <div className="badge" style={{ position: 'absolute' }}>
            <Pill kind="sim">Simulated map · demonstration only</Pill>
          </div>
          <RouteMap progress={dest ? progress : 0} alt={alt} label={dest ? `Simulated route to ${dest}` : 'Simulated map, no destination selected'} />
          {dest && (
            <div className="eta">
              <div style={{ fontSize: 22, fontWeight: 650 }}>{remainingMin} min</div>
              <div className="small muted">
                {remainingKm} km · arrive {arrival}
              </div>
            </div>
          )}
        </div>

        {dest ? (
          <>
            <div className="turn">
              <CornerUpRight size={44} />
              <div className="grow">
                <div className="big">{remainingKm} km</div>
                <div>Turn right onto Outer Ring Road</div>
                <div className="small" style={{ opacity: 0.85 }}>
                  Destination: {dest} · demo guidance only
                </div>
              </div>
            </div>
            <div className="tabs" role="tablist" aria-label="Route options">
              {ROUTE_NAMES.map((n, i) => (
                <button key={n} type="button" role="tab" aria-selected={alt === i} className={`chip ${alt === i ? 'active' : ''}`} onClick={() => setAlt(i)}>
                  {n} · {ROUTE_TIMES[i]} min
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="notice">Choose a destination on the right to preview a simulated route.</div>
        )}
      </div>

      <div className="stack">
        <section className="card">
          <h3>Destination</h3>
          <div className="row">
            <Search size={20} aria-hidden="true" />
            <input className="input grow" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search demo places" aria-label="Search destination" />
            <button type="button" className="btn icon" aria-label="Voice destination" onClick={() => go('assistant')}>
              <Mic size={20} />
            </button>
          </div>
          <ul className="list" style={{ marginTop: 12 }}>
            {results.map((p) => (
              <li key={p.name}>
                <button type="button" className="list-btn" onClick={() => choose(p.name)}>
                  <span className="grow">{p.name}</span>
                  <span className="small muted">{p.km} km</span>
                </button>
              </li>
            ))}
            {results.length === 0 && <li className="muted small">No demo places match "{query}".</li>}
          </ul>
        </section>

        <section className="card">
          <h3>
            <Star size={16} style={{ verticalAlign: 'text-bottom' }} /> Favorites
          </h3>
          <ul className="list">
            {FAVORITE_PLACES.map((n) => (
              <li key={n}>
                <button type="button" className="list-btn" onClick={() => choose(n)}>
                  {n}
                </button>
              </li>
            ))}
          </ul>
          <h3 style={{ marginTop: 16 }}>Recent</h3>
          <ul className="list">
            {recent.map((n) => (
              <li key={n}>
                <button type="button" className="list-btn" onClick={() => choose(n)}>
                  {n}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <div className="field-row" style={{ paddingTop: 0 }}>
            <div>
              <div style={{ fontWeight: 600 }}>Voice guidance</div>
              <div className="small muted">Spoken prompts for demo routes</div>
            </div>
            <Toggle checked={prefs.navVoice} onChange={(v) => setPrefs({ navVoice: v })} label="Voice guidance" />
          </div>
          <div className="field-row">
            <div>
              <div style={{ fontWeight: 600 }}>Traffic</div>
              <div className="small muted">Not connected in this demo</div>
            </div>
            <Pill kind="warn">Unavailable</Pill>
          </div>
        </section>

        <section className="card" aria-label="Now playing, compact">
          <div className="row">
            <Heart size={18} aria-hidden="true" />
            <div className="grow" style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.track.title}</div>
              <div className="small muted">
                {fmtTime(player.elapsed)} / {fmtTime(player.track.seconds)} · simulated
              </div>
            </div>
            <button type="button" className="btn icon" onClick={player.toggle} aria-label={player.playing ? 'Pause' : 'Play'}>
              {player.playing ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button type="button" className="btn" onClick={player.next}>
              Next
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
