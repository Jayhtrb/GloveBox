import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Mic, MicOff, Send, Sparkles } from 'lucide-react';
import { useApp } from '../store';
import { COMMAND_SUGGESTIONS } from '../data';
import { runCommand, type CommandContext } from '../commands';
import { Pill } from '../components/Primitives';
import { isNative, native } from '../native';

interface Turn {
  role: 'user' | 'assistant';
  text: string;
}

type SpeechRec = {
  lang: string;
  onresult: ((e: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getRecognizer(): (new () => SpeechRec) | null {
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function Assistant() {
  const app = useApp();
  const { prefs, allApps, go, openUrl, launch, player, setPrefs } = app;
  const [turns, setTurns] = useState<Turn[]>([
    { role: 'assistant', text: `Hi ${prefs.name}. I can run local commands for apps, music, navigation, and the look of the display. Try a suggestion or say a command.` },
  ]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const recRef = useRef<SpeechRec | null>(null);

  const ctx: CommandContext = {
    apps: allApps,
    pinned: prefs.pinned.map((id) => allApps.find((a) => a.id === id)).filter((a): a is NonNullable<typeof a> => Boolean(a)),
    driveMode: prefs.driveMode,
    go,
    openUrl,
    launch,
    play: player.play,
    pause: player.pause,
    next: player.next,
    setTheme: (t) => setPrefs({ theme: t }),
    navigateTo: (place) => {
      setPrefs({ lastDestination: place });
      go('navigation');
    },
    playlistName: 'your demo favorites',
  };

  const submit = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const result = runCommand(text, ctx);
    setTurns((t) => [...t, { role: 'user', text }, { role: 'assistant', text: result.reply }]);
    setInput('');
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(input);
  };

  // Inside the Android app, the system recognizer returns its result through this hook.
  const submitRef = useRef(submit);
  submitRef.current = submit;
  useEffect(() => {
    if (!isNative) return;
    window.gloveboxVoiceResult = (text: string) => {
      setListening(false);
      if (text.trim()) {
        setNote(null);
        submitRef.current(text);
      } else {
        setNote('No speech was recognized. Try again or type your command.');
      }
    };
    return () => {
      delete window.gloveboxVoiceResult;
    };
  }, []);

  const listen = () => {
    if (isNative) {
      setNote(null);
      setListening(true);
      native?.startVoice();
      return;
    }
    const Rec = getRecognizer();
    if (!Rec) {
      setNote('Voice input is not supported in this browser. Type your command below.');
      return;
    }
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new Rec();
    rec.lang = navigator.language || 'en-US';
    rec.onresult = (e) => {
      const said = e.results[0][0].transcript;
      setNote(null);
      submit(said);
    };
    rec.onerror = (e) => {
      setNote(e.error === 'not-allowed' ? 'Microphone access was blocked. You can still type commands.' : `Voice input stopped (${e.error}). Type your command instead.`);
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setNote(null);
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
      setNote('Voice input could not start. Type your command instead.');
    }
  };

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="row wrap" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 28, letterSpacing: '-0.4px' }}>GloveBox Assistant</h1>
        <Pill kind="sim">Local commands · no AI provider connected</Pill>
      </div>

      <div className="media-grid" style={{ gridTemplateColumns: 'minmax(260px, 360px) 1fr' }}>
        <section className="card" aria-label="Assistant orb">
          <div className="orb-wrap">
            <div className={`orb ${listening ? 'listening' : ''}`} aria-hidden="true" />
          </div>
          <div style={{ textAlign: 'center', fontWeight: 620 }} aria-live="polite">
            {listening ? 'Listening…' : 'Ready'}
          </div>
          <div className="row" style={{ justifyContent: 'center', marginTop: 16 }}>
            <button type="button" className="round" onClick={listen} aria-label={listening ? 'Stop listening' : 'Start voice command'} aria-pressed={listening}>
              {listening ? <MicOff size={26} /> : <Mic size={26} />}
            </button>
          </div>
          {note && (
            <div className="notice warn" style={{ marginTop: 16 }} role="status">
              {note}
            </div>
          )}
        </section>

        <section className="card" aria-label="Conversation">
          <div className="log" role="log" aria-live="polite">
            {turns.map((t, i) => (
              <div key={i} className={`bubble ${t.role === 'user' ? 'user' : ''}`}>
                {t.role === 'assistant' && <Sparkles size={14} style={{ marginRight: 6, verticalAlign: 'text-top' }} aria-hidden="true" />}
                {t.text}
              </div>
            ))}
          </div>

          {prefs.voiceSuggestions && (
            <div className="tabs" style={{ marginTop: 14 }} aria-label="Suggested commands">
              {COMMAND_SUGGESTIONS.map((c) => (
                <button key={c} type="button" className="chip" onClick={() => submit(c)}>
                  {c}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={onSubmit} className="row" style={{ marginTop: 14 }}>
            <input className="input grow" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a command" aria-label="Type a command" autoCapitalize="none" />
            <button type="submit" className="btn primary" aria-label="Send command">
              <Send size={18} /> Send
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
