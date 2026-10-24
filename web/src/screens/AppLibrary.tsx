import { useMemo, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, Pin, PinOff, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../store';
import { CATEGORIES, type AppDef, type Category } from '../data';
import { Mark, Modal, Pill } from '../components/Primitives';
import { toUrl } from '../format';

const PALETTE = ['#2f7dd1', '#7a4fd8', '#1f9d8a', '#c0583a', '#b5830f', '#4c6e91'];

export default function AppLibrary() {
  const { prefs, setPrefs, allApps, launch } = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'All' | Category>('All');
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const pinned = prefs.pinned.map((id) => allApps.find((a) => a.id === id)).filter((a): a is AppDef => Boolean(a));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allApps.filter(
      (a) =>
        (category === 'All' || a.category === category) &&
        (q === '' || a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)),
    );
  }, [allApps, query, category]);

  const togglePin = (id: string) => {
    setPrefs({ pinned: prefs.pinned.includes(id) ? prefs.pinned.filter((x) => x !== id) : [...prefs.pinned, id] });
  };

  const move = (id: string, dir: -1 | 1) => {
    const i = prefs.pinned.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= prefs.pinned.length) return;
    const next = [...prefs.pinned];
    [next[i], next[j]] = [next[j], next[i]];
    setPrefs({ pinned: next });
  };

  const removeCustom = (id: string) => {
    setPrefs({
      customApps: prefs.customApps.filter((a) => a.id !== id),
      pinned: prefs.pinned.filter((x) => x !== id),
    });
    setOpenId(null);
  };

  const setLaunch = (id: string, mode: 'browser' | 'newtab') => setPrefs({ launch: { ...prefs.launch, [id]: mode } });

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="row wrap" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 28, letterSpacing: '-0.4px' }}>App Library</h1>
        <button type="button" className="btn primary" onClick={() => setAdding(true)}>
          <Plus size={18} /> Add web app
        </button>
      </div>

      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}

      <section className="card" aria-label="Favorites dock order">
        <h3>Favorites dock</h3>
        {pinned.length === 0 ? (
          <p className="muted small">Pin apps below to add them to the Home dock.</p>
        ) : (
          <ul className="list">
            {pinned.map((app, i) => (
              <li key={app.id}>
                <div className="list-btn" style={{ cursor: 'default' }}>
                  <Mark app={app} small />
                  <span className="grow">{app.name}</span>
                  <button type="button" className="btn icon" onClick={() => move(app.id, -1)} disabled={i === 0} aria-label={`Move ${app.name} up`}>
                    <ArrowUp size={18} />
                  </button>
                  <button type="button" className="btn icon" onClick={() => move(app.id, 1)} disabled={i === pinned.length - 1} aria-label={`Move ${app.name} down`}>
                    <ArrowDown size={18} />
                  </button>
                  <button type="button" className="btn icon" onClick={() => togglePin(app.id)} aria-label={`Unpin ${app.name}`}>
                    <PinOff size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="row wrap">
        <input className="input grow" style={{ maxWidth: 420 }} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search apps" aria-label="Search apps" />
        <div className="tabs" role="group" aria-label="Filter by category">
          {(['All', ...CATEGORIES] as const).map((c) => (
            <button key={c} type="button" className={`chip ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)} aria-pressed={category === c}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <section aria-label="App list" className="stack" style={{ gap: 10 }}>
        {filtered.length === 0 && <div className="card muted">No apps match "{query}" in {category === 'All' ? 'any category' : category}.</div>}
        {filtered.map((app) => {
          const isPinned = prefs.pinned.includes(app.id);
          const isWeb = Boolean(app.url);
          const isOpen = openId === app.id;
          const custom = app.id.startsWith('custom-');
          const mode = prefs.launch[app.id] ?? 'browser';
          return (
            <div key={app.id} className="card" style={{ padding: 14 }}>
              <div className="row">
                <Mark app={app} />
                <div className="grow" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 620, fontSize: 17 }}>{app.name}</div>
                  <div className="row wrap small muted" style={{ marginTop: 4 }}>
                    <Pill>{app.category}</Pill>
                    <Pill kind={isWeb ? 'sim' : 'live'}>{isWeb ? 'Web shortcut' : 'In-app'}</Pill>
                    {isWeb && <Pill kind="warn">Not embedded by default</Pill>}
                  </div>
                </div>
                <button type="button" className="btn" onClick={() => launch(app)} aria-label={`Open ${app.name}`}>
                  Open
                </button>
                <button type="button" className={`btn icon ${isPinned ? 'primary' : ''}`} onClick={() => togglePin(app.id)} aria-pressed={isPinned} aria-label={isPinned ? `Unpin ${app.name}` : `Pin ${app.name}`}>
                  <Pin size={18} />
                </button>
                <button type="button" className="btn icon" onClick={() => setOpenId(isOpen ? null : app.id)} aria-expanded={isOpen} aria-label={`Details for ${app.name}`}>
                  <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                </button>
              </div>
              {isOpen && (
                <div className="stack" style={{ marginTop: 14, gap: 12 }}>
                  <p className="small" style={{ margin: 0 }}>{app.note}</p>
                  {isWeb && (
                    <div className="field-row" style={{ borderBottom: 0, padding: 0 }}>
                      <span>Launch method</span>
                      <select className="input" style={{ maxWidth: 260 }} value={mode} onChange={(e) => setLaunch(app.id, e.target.value as 'browser' | 'newtab')} aria-label={`Launch method for ${app.name}`}>
                        <option value="browser">Open in GloveBox browser</option>
                        <option value="newtab">Open in a new tab</option>
                      </select>
                    </div>
                  )}
                  {app.url && <div className="small muted">Address: {app.url}</div>}
                  {custom && (
                    <button type="button" className="btn danger" onClick={() => removeCustom(app.id)}>
                      <Trash2 size={18} /> Remove app
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {adding && (
        <AddAppDialog
          onClose={() => setAdding(false)}
          onAdd={(app) => {
            setPrefs({ customApps: [...prefs.customApps, app] });
            setAdding(false);
            setMessage(`${app.name} was added to your library. Pin it to show it on Home.`);
          }}
        />
      )}
    </div>
  );
}

function AddAppDialog({ onClose, onAdd }: { onClose: () => void; onAdd: (app: AppDef) => void }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<Category>('Utilities');
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const finalUrl = toUrl(url);
    if (!name.trim()) return setError('Enter a name for the app.');
    if (!/^https:\/\//i.test(finalUrl)) return setError('Enter a web address, for example example.com.');
    try {
      new URL(finalUrl);
    } catch {
      return setError("That address doesn't look valid.");
    }
    const id = `custom-${Date.now()}`;
    onAdd({
      id,
      name: name.trim().slice(0, 40),
      category,
      mark: name.trim().slice(0, 2).toUpperCase(),
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      url: finalUrl,
      note: 'Your web shortcut. It opens in the GloveBox browser and is not embedded by default.',
    });
  };

  return (
    <Modal title="Add a web app" onClose={onClose}>
      <form onSubmit={submit} className="stack">
        <label className="stack" style={{ gap: 6 }}>
          <span>Name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="My dashboard" autoFocus />
        </label>
        <label className="stack" style={{ gap: 6 }}>
          <span>Web address</span>
          <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="example.com" inputMode="url" autoCapitalize="none" />
        </label>
        <label className="stack" style={{ gap: 6 }}>
          <span>Category</span>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        {error && <div className="notice warn" role="alert">{error}</div>}
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn primary">
            Add app
          </button>
        </div>
      </form>
    </Modal>
  );
}
