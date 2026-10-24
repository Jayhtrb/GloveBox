import { useState } from 'react';
import { CloudSun, CornerUpRight, Info, Music, Pause, Play, Plus, SkipForward, Smartphone } from 'lucide-react';
import { useApp } from '../store';
import { SHOWS, TRACKS, type AppDef } from '../data';
import { Mark, Modal, Pill } from '../components/Primitives';
import { RouteMap, useDemoProgress } from '../components/RouteMap';
import { fmtTime, hostOf } from '../format';

export default function Home() {
  const { prefs, allApps, go, launch, player, openUrl } = useApp();
  const drive = prefs.driveMode;
  const [showInfo, setShowInfo] = useState(false);
  const progress = useDemoProgress(90);

  const pinned = prefs.pinned
    .map((id) => allApps.find((a) => a.id === id))
    .filter((a): a is AppDef => Boolean(a));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateLabel = new Date().toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });

  const show = SHOWS[0];
  const remainingKm = (18 * (1 - progress)).toFixed(1);
  const remainingMin = Math.max(1, Math.round(32 * (1 - progress)));
  const arrival = new Date(Date.now() + remainingMin * 60000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  const track = TRACKS[player.trackIndex];
  const trackPct = (player.elapsed / player.track.seconds) * 100;
  const recentHosts = prefs.recentUrls.slice(0, 4);

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="home-grid">
        {!drive && (
          <section
            className="card featured"
            aria-label="Featured entertainment"
            style={{ background: `linear-gradient(180deg, ${show.from}, ${show.to})` }}
          >
            <div className="row">
              <Pill kind="sim">Placeholder artwork</Pill>
            </div>
            <div className="muted small" style={{ marginTop: 'auto' }}>
              Demo service · {show.episode} · {show.minutesLeft} min left
            </div>
            <h1>{show.title}</h1>
            <div className="row wrap">
              <button type="button" className="btn primary" onClick={() => go('media')}>
                <Play size={18} /> Resume
              </button>
              <button type="button" className="btn" onClick={() => setShowInfo(true)}>
                <Info size={18} /> More Information
              </button>
            </div>
          </section>
        )}

        <section className="card navwidget" aria-label="Navigation preview">
          <div className="row">
            <h3 className="grow">Navigation</h3>
            <Pill kind="sim">Simulated map</Pill>
          </div>
          <div className="map">
            <RouteMap progress={progress} label="Simulated route preview" />
          </div>
          <div className="turn">
            <CornerUpRight size={36} />
            <div>
              <div className="big">{remainingKm} km</div>
              <div>Turn right · Outer Ring Road</div>
            </div>
          </div>
          <div className="row small muted wrap">
            <span>{remainingMin} min</span>·<span>arrive {arrival}</span>·<span>Demo destination: Lakeview Park</span>
          </div>
          <button type="button" className="btn" onClick={() => go('navigation')}>
            Open navigation
          </button>
        </section>
      </div>

      <section aria-label="Favorite apps">
        <div className={`dock ${drive ? 'drive' : ''}`}>
          {pinned.map((app) => (
            <button type="button" key={app.id} className="tile" onClick={() => launch(app)} aria-label={`Open ${app.name}`}>
              <Mark app={app} />
              <span>{app.name}</span>
            </button>
          ))}
          <button type="button" className="tile" onClick={() => go('apps')} aria-label="Add app">
            <span className="mark" style={{ background: 'var(--card-2)', color: 'var(--text)', border: '1px solid var(--line-strong)' }}>
              <Plus size={28} />
            </span>
            <span>Add App</span>
          </button>
        </div>
      </section>

      <div className="info-grid">
        <section className="card" aria-label="Greeting and weather">
          <h2>
            {greeting}, {prefs.name}
          </h2>
          <div className="muted small">{dateLabel}</div>
          {prefs.widgets.weather && (
            <div className="row" style={{ marginTop: 14 }}>
              <CloudSun size={38} />
              <div className="grow">
                <div style={{ fontSize: 28, fontWeight: 650 }}>28°</div>
                <div className="small muted">Hyderabad · Mostly sunny</div>
              </div>
              <Pill kind="sim">Simulated</Pill>
            </div>
          )}
        </section>

        {!drive && prefs.widgets.continueWatching && (
          <section className="card" aria-label="Continue watching">
            <div className="row" style={{ marginBottom: 10 }}>
              <h3 className="grow">Continue Watching</h3>
              <Pill kind="sim">Demo</Pill>
            </div>
            <div className="stack" style={{ gap: 8 }}>
              {SHOWS.slice(0, 3).map((s) => (
                <button
                  type="button"
                  key={s.title}
                  className="media-thumb"
                  style={{ background: `linear-gradient(160deg, ${s.from}, ${s.to})` }}
                  onClick={() => go('media')}
                >
                  <span>{s.title}</span>
                  <span className="small" style={{ opacity: 0.8 }}>
                    {s.episode} · {s.minutesLeft} min left
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {prefs.widgets.nowPlaying && (
          <section className="card" aria-label="Now playing">
            <div className="row" style={{ marginBottom: 10 }}>
              <h3 className="grow">Now Playing</h3>
              <Pill kind="sim">Simulated</Pill>
            </div>
            <div className="row">
              <span className="mark" style={{ background: `linear-gradient(160deg, ${track.from}, ${track.to})` }}>
                <Music size={22} />
              </span>
              <div className="grow">
                <div style={{ fontWeight: 620 }}>{track.title}</div>
                <div className="small muted">{track.artist}</div>
              </div>
            </div>
            <div className="progress" style={{ margin: '14px 0 6px' }} aria-hidden="true">
              <span style={{ width: `${trackPct}%` }} />
            </div>
            <div className="row small muted" style={{ justifyContent: 'space-between' }}>
              <span>{fmtTime(player.elapsed)}</span>
              <span>-{fmtTime(player.track.seconds - player.elapsed)}</span>
            </div>
            <div className="row" style={{ justifyContent: 'center', gap: 18, marginTop: 10 }}>
              <button type="button" className="round" onClick={player.toggle} aria-label={player.playing ? 'Pause' : 'Play'}>
                {player.playing ? <Pause size={26} /> : <Play size={26} />}
              </button>
              <button type="button" className="btn icon" onClick={player.next} aria-label="Next track">
                <SkipForward size={22} />
              </button>
            </div>
          </section>
        )}

        <section className="card" aria-label="Vehicle and phone status">
          <h3>Connections</h3>
          <div className="stack" style={{ gap: 10 }}>
            <div className="row">
              <Smartphone size={20} />
              <span className="grow">Phone</span>
              <Pill kind="sim">Connected · simulated</Pill>
            </div>
            <div className="row">
              <span className="grow">Android Auto</span>
              <Pill kind="warn">Not connected · demo</Pill>
            </div>
            <div className="row">
              <span className="grow">Vehicle data</span>
              <Pill kind="sim">Demo values only</Pill>
            </div>
          </div>
        </section>

        {!drive && prefs.widgets.recent && (
          <section className="card" aria-label="Recently visited">
            <h3>Recently Visited</h3>
            {recentHosts.length === 0 ? (
              <p className="muted small">Pages you open in the browser will appear here.</p>
            ) : (
              <ul className="list">
                {recentHosts.map((u) => (
                  <li key={u}>
                    <button type="button" className="list-btn" onClick={() => openUrl(u)}>
                      <span className="grow" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {hostOf(u)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      {showInfo && (
        <Modal title={show.title} onClose={() => setShowInfo(false)}>
          <p>{show.synopsis}</p>
          <p className="muted small">Placeholder metadata. This is not a real title or a licensed service.</p>
        </Modal>
      )}
    </div>
  );
}
