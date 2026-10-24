import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink, House, RotateCw, Star } from 'lucide-react';
import { useApp } from '../store';
import { Mark } from '../components/Primitives';
import { hostOf, toUrl } from '../format';

type LoadState = 'loading' | 'loaded' | 'slow';

export default function Browser() {
  const { prefs, setPrefs, browserTarget, go, allApps } = useApp();
  const drive = prefs.driveMode;

  const [nav, setNav] = useState({ history: [browserTarget.url], index: 0 });
  const current = nav.history[nav.index];
  const [address, setAddress] = useState(browserTarget.url);
  const [reloadKey, setReloadKey] = useState(0);
  const [load, setLoad] = useState<LoadState>('loading');

  const visit = (raw: string) => {
    const url = toUrl(raw);
    if (!url) return;
    setNav((n) => ({ history: [...n.history.slice(0, n.index + 1), url], index: n.index + 1 }));
    setAddress(url);
    setLoad('loading');
    setReloadKey((k) => k + 1);
  };

  // Opened from elsewhere in the app (Home, the library, or voice).
  useEffect(() => {
    if (browserTarget.n > 0 && browserTarget.url !== current) visit(browserTarget.url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [browserTarget.n]);

  // A page that never fires "load" is reported as slow after 12 seconds.
  useEffect(() => {
    if (drive) return;
    setLoad('loading');
    const id = window.setTimeout(() => setLoad((s) => (s === 'loaded' ? s : 'slow')), 12000);
    return () => window.clearTimeout(id);
  }, [current, reloadKey, drive]);

  const isBookmarked = prefs.bookmarks.some((b) => b.url === current);
  const toggleBookmark = () =>
    setPrefs({
      bookmarks: isBookmarked
        ? prefs.bookmarks.filter((b) => b.url !== current)
        : [...prefs.bookmarks, { title: hostOf(current), url: current }],
    });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    visit(address);
  };

  const webApps = allApps.filter((a) => a.url);

  if (drive) {
    return (
      <div className="card" style={{ maxWidth: 680, margin: '40px auto' }}>
        <h2>The browser is paused while driving</h2>
        <p className="muted">
          Web pages and video are available when parked. Voice, music, navigation, and your apps still work.
        </p>
        <div className="row wrap" style={{ marginTop: 16 }}>
          <button type="button" className="btn primary big" onClick={() => go('home')}>
            Back to GloveBox
          </button>
          <button type="button" className="btn big" onClick={() => go('assistant')}>
            Open assistant
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="browser">
      <div className="toolbar">
        <button
          type="button"
          className="btn icon"
          onClick={() => setNav((n) => (n.index > 0 ? { ...n, index: n.index - 1 } : n))}
          disabled={nav.index === 0}
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>
        <button
          type="button"
          className="btn icon"
          onClick={() => setNav((n) => (n.index < n.history.length - 1 ? { ...n, index: n.index + 1 } : n))}
          disabled={nav.index >= nav.history.length - 1}
          aria-label="Forward"
        >
          <ArrowRight size={22} />
        </button>
        <button
          type="button"
          className="btn icon"
          onClick={() => {
            setLoad('loading');
            setReloadKey((k) => k + 1);
          }}
          aria-label="Reload"
        >
          <RotateCw size={20} />
        </button>
        <button type="button" className="btn icon" onClick={() => visit(prefs.homeUrl)} aria-label="Browser home">
          <House size={20} />
        </button>
        <form onSubmit={onSubmit} className="grow" role="search">
          <input
            className="input"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            aria-label="Address or search"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Search or enter an address"
          />
        </form>
        <button
          type="button"
          className="btn icon"
          onClick={toggleBookmark}
          aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          aria-pressed={isBookmarked}
        >
          <Star size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>
        <button type="button" className="btn" onClick={() => go('home')}>
          GloveBox
        </button>
      </div>

      <div className="notice warn small" style={{ padding: '10px 14px' }}>
        <span className="grow">
          Some websites don't allow being shown inside other apps. If the page is blank, use Open in new tab. GloveBox never gets around site restrictions.
        </span>
        <button type="button" className="btn" style={{ minHeight: 40 }} onClick={() => window.open(current, '_blank', 'noopener,noreferrer')}>
          <ExternalLink size={16} /> Open in new tab
        </button>
      </div>

      <div className="browser-body">
        <aside className="stack" aria-label="Browser shortcuts and history" style={{ overflow: 'auto' }}>
          <section className="card">
            <h3>Web app shortcuts</h3>
            <ul className="list">
              {webApps.map((app) => (
                <li key={app.id}>
                  <button type="button" className="list-btn" onClick={() => visit(app.url ?? '')}>
                    <Mark app={app} small />
                    <span>{app.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h3>Bookmarks</h3>
            {prefs.bookmarks.length === 0 ? (
              <p className="muted small">Tap the star to bookmark the current page.</p>
            ) : (
              <ul className="list">
                {prefs.bookmarks.map((b) => (
                  <li key={b.url}>
                    <button type="button" className="list-btn" onClick={() => visit(b.url)}>
                      <span className="grow" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {b.title}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <h3>Recent</h3>
            {prefs.recentUrls.length === 0 ? (
              <p className="muted small">No recent pages yet.</p>
            ) : (
              <ul className="list">
                {prefs.recentUrls.slice(0, 6).map((u) => (
                  <li key={u}>
                    <button type="button" className="list-btn" onClick={() => visit(u)}>
                      <span className="grow" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {hostOf(u)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>

        <div className="frame-wrap">
          {load !== 'loaded' && (
            <div className="frame-status" role="status" aria-live="polite">
              {load === 'loading' ? (
                <div>
                  <div className="spinner" />
                  <div>Loading {hostOf(current)}…</div>
                </div>
              ) : (
                <div style={{ maxWidth: 420 }}>
                  <h3 style={{ margin: '0 0 8px' }}>This page isn't showing</h3>
                  <p className="muted small">
                    It may be slow, or the site doesn't allow being shown here. You can try again or open it in a new tab.
                  </p>
                  <div className="row wrap" style={{ justifyContent: 'center' }}>
                    <button type="button" className="btn" onClick={() => { setLoad('loading'); setReloadKey((k) => k + 1); }}>
                      Try again
                    </button>
                    <button type="button" className="btn primary" onClick={() => window.open(current, '_blank', 'noopener,noreferrer')}>
                      Open in new tab
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          <iframe
            key={`${reloadKey}:${current}`}
            title={`Web page: ${hostOf(current)}`}
            src={current}
            sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => setLoad('loaded')}
          />
        </div>
      </div>
    </div>
  );
}
