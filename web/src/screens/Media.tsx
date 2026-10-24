import { useEffect, useState, type MouseEvent } from 'react';
import { Maximize, Pause, Play, Repeat, Shuffle, SkipBack, SkipForward, Subtitles, Volume2, Heart, X } from 'lucide-react';
import { useApp } from '../store';
import { SHOWS, TRACKS } from '../data';
import { Pill } from '../components/Primitives';
import { fmtTime } from '../format';

type Mode = 'audio' | 'video';
const SOURCES = ['Demo library', 'Phone (simulated)', 'Bluetooth (simulated)'];

export default function Media() {
  const { prefs, setPrefs, player } = useApp();
  const [mode, setMode] = useState<Mode>('audio');
  const [source, setSource] = useState(SOURCES[0]);
  const drive = prefs.driveMode;
  const effectiveMode: Mode = drive ? 'audio' : mode;

  const t = player.track;
  const pct = t.seconds ? (player.elapsed / t.seconds) * 100 : 0;
  const fav = prefs.favoriteTracks.includes(t.title);
  const toggleFav = () =>
    setPrefs({
      favoriteTracks: fav ? prefs.favoriteTracks.filter((x) => x !== t.title) : [...prefs.favoriteTracks, t.title],
    });

  const seekFromClick = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const p = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
    player.seek(p * t.seconds);
  };

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="tabs" role="tablist" aria-label="Media mode">
        <button type="button" role="tab" aria-selected={effectiveMode === 'audio'} className={`chip ${effectiveMode === 'audio' ? 'active' : ''}`} onClick={() => setMode('audio')}>
          Audio
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={effectiveMode === 'video'}
          className={`chip ${effectiveMode === 'video' ? 'active' : ''}`}
          onClick={() => setMode('video')}
          disabled={drive}
          title={drive ? 'Video is available when parked' : 'Video mode'}
        >
          Video
        </button>
        {drive && <Pill kind="warn">Video locked while driving</Pill>}
      </div>

      {effectiveMode === 'audio' ? (
        <div className="media-grid">
          <section className="card" aria-label="Player">
            <div className="artwork" style={{ background: `linear-gradient(160deg, ${t.from}, ${t.to})` }}>
              {t.title}
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 22, fontWeight: 650 }}>{t.title}</div>
              <div className="muted">{t.artist}</div>
            </div>
            <div className="row" style={{ marginTop: 14 }}>
              <Pill kind="sim">Simulated playback · no audio file</Pill>
            </div>
            <div className="progress" style={{ marginTop: 16 }} onClick={seekFromClick} role="slider" aria-label="Seek" aria-valuemin={0} aria-valuemax={t.seconds} aria-valuenow={Math.round(player.elapsed)} tabIndex={0}>
              <span style={{ width: `${pct}%` }} />
            </div>
            <div className="row small muted" style={{ justifyContent: 'space-between', marginTop: 6 }}>
              <span>{fmtTime(player.elapsed)}</span>
              <span>-{fmtTime(t.seconds - player.elapsed)}</span>
            </div>
            <div className="row" style={{ justifyContent: 'center', gap: 16, marginTop: 14 }}>
              <button type="button" className={`btn icon ${player.shuffle ? 'primary' : ''}`} onClick={() => player.setShuffle(!player.shuffle)} aria-label="Shuffle" aria-pressed={player.shuffle}>
                <Shuffle size={20} />
              </button>
              <button type="button" className="btn icon" onClick={player.prev} aria-label="Previous track">
                <SkipBack size={22} />
              </button>
              <button type="button" className="round" onClick={player.toggle} aria-label={player.playing ? 'Pause' : 'Play'}>
                {player.playing ? <Pause size={28} /> : <Play size={28} />}
              </button>
              <button type="button" className="btn icon" onClick={player.next} aria-label="Next track">
                <SkipForward size={22} />
              </button>
              <button type="button" className={`btn icon ${player.repeat ? 'primary' : ''}`} onClick={() => player.setRepeat(!player.repeat)} aria-label="Repeat" aria-pressed={player.repeat}>
                <Repeat size={20} />
              </button>
            </div>
            <div className="row" style={{ marginTop: 18 }}>
              <Volume2 size={20} />
              <input
                className="slider grow"
                type="range"
                min={0}
                max={100}
                value={player.volume}
                onChange={(e) => player.setVolume(Number(e.target.value))}
                aria-label="Volume (simulated)"
              />
              <button type="button" className={`btn icon ${fav ? 'primary' : ''}`} onClick={toggleFav} aria-label={fav ? 'Remove from favorites' : 'Add to favorites'} aria-pressed={fav}>
                <Heart size={20} fill={fav ? 'currentColor' : 'none'} />
              </button>
            </div>
          </section>

          <div className="stack">
            <section className="card">
              <h3>Audio source</h3>
              <select className="input" value={source} onChange={(e) => setSource(e.target.value)} aria-label="Audio source">
                {SOURCES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <p className="muted small" style={{ marginTop: 10 }}>
                Media session: <Pill kind="sim">Not connected · simulated</Pill>
              </p>
            </section>

            <section className="card">
              <h3>Queue</h3>
              <ul className="list">
                {TRACKS.map((tr, i) => (
                  <li key={tr.title}>
                    <button type="button" className="list-btn" onClick={() => player.playTrack(i)} aria-current={i === player.trackIndex}>
                      <span className="mark sm" style={{ background: `linear-gradient(160deg, ${tr.from}, ${tr.to})` }} aria-hidden="true" />
                      <span className="grow">
                        <span style={{ display: 'block', fontWeight: i === player.trackIndex ? 650 : 500 }}>{tr.title}</span>
                        <span className="small muted">{tr.artist}</span>
                      </span>
                      {i === player.trackIndex && player.playing && <Pill kind="live">Playing</Pill>}
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card">
              <h3>Favorites</h3>
              {prefs.favoriteTracks.length === 0 ? (
                <p className="muted small">Tap the heart on a track to save it here.</p>
              ) : (
                <ul className="list">
                  {prefs.favoriteTracks.map((title) => {
                    const idx = TRACKS.findIndex((x) => x.title === title);
                    if (idx < 0) return null;
                    return (
                      <li key={title}>
                        <button type="button" className="list-btn" onClick={() => player.playTrack(idx)}>
                          {title}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>
      ) : (
        <VideoMode onExit={() => setMode('audio')} />
      )}
    </div>
  );
}

/** Demo video screen. There is no bundled video, so playback is simulated and labelled as such. */
function VideoMode({ onExit }: { onExit: () => void }) {
  const [show, setShow] = useState(SHOWS[0]);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [subs, setSubs] = useState(false);
  const total = 45 * 60;

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setElapsed((e) => (e + 1 >= total ? total : e + 1)), 1000);
    return () => window.clearInterval(id);
  }, [playing]);

  const fullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => undefined);
  };

  return (
    <div className="media-grid">
      <div className="stack">
        <div className="video-stage" style={{ background: `radial-gradient(circle at 60% 30%, ${show.from}, ${show.to} 75%)` }}>
          <div>
            <Pill kind="sim">Demo screen · no playable source configured</Pill>
            <h2 style={{ fontSize: 30, margin: '16px 0 6px' }}>{show.title}</h2>
            <div className="muted">{show.synopsis}</div>
          </div>
          <div className="controls" aria-label="Video controls (simulated)">
            <div className="progress" onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setElapsed(Math.round(((e.clientX - r.left) / r.width) * total));
            }} role="slider" aria-label="Timeline" aria-valuemin={0} aria-valuemax={total} aria-valuenow={elapsed} tabIndex={0}>
              <span style={{ width: `${(elapsed / total) * 100}%` }} />
            </div>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="small">{fmtTime(elapsed)}</span>
              <div className="row">
                <button type="button" className="btn icon" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play'}>
                  {playing ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <button
                  type="button"
                  className={`btn icon ${subs ? 'primary' : ''}`}
                  onClick={() => setSubs((s) => !s)}
                  aria-pressed={subs}
                  title="Subtitles (not available in this demo)"
                  disabled
                >
                  <Subtitles size={20} />
                </button>
                <button type="button" className="btn icon" onClick={fullscreen} aria-label="Full screen">
                  <Maximize size={20} />
                </button>
                <button type="button" className="btn icon" onClick={onExit} aria-label="Exit video">
                  <X size={20} />
                </button>
              </div>
              <span className="small">-{fmtTime(total - elapsed)}</span>
            </div>
          </div>
        </div>
        <p className="muted small">Subtitles and audio tracks need a licensed video source. They are not available in this demo.</p>
      </div>

      <section className="card">
        <h3>Related</h3>
        <ul className="list">
          {SHOWS.map((s) => (
            <li key={s.title}>
              <button type="button" className="list-btn" onClick={() => { setShow(s); setElapsed(0); setPlaying(false); }} aria-current={s.title === show.title}>
                <span className="grow">
                  <span style={{ display: 'block', fontWeight: 600 }}>{s.title}</span>
                  <span className="small muted">{s.episode} · placeholder</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
