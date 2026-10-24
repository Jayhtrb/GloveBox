import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/** Three demo routes. Index 0 is the main route. */
export const ROUTE_PATHS = [
  'M60 330 C 150 330, 170 250, 260 240 S 400 120, 540 90',
  'M60 330 C 120 200, 250 300, 330 200 S 460 90, 540 90',
  'M60 330 L 200 330 L 240 170 L 540 90',
];

/**
 * Animated progress from 0 to 1 that loops, used to move the demo car along the route.
 * It is a timer, not GPS. Nothing here reflects the real vehicle position.
 */
export function useDemoProgress(seconds = 90, paused = false): number {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => setP((x) => (x + 1 / seconds >= 1 ? 0 : x + 1 / seconds)), 1000);
    return () => window.clearInterval(id);
  }, [seconds, paused]);
  return p;
}

export function RouteMap({ progress, alt = 0, label }: { progress: number; alt?: number; label: string }) {
  const pathRef = useRef<SVGPathElement>(null);
  const [pt, setPt] = useState({ x: 60, y: 330 });

  useLayoutEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    const q = path.getPointAtLength(len * Math.min(Math.max(progress, 0), 1));
    setPt({ x: q.x, y: q.y });
  }, [progress, alt]);

  return (
    <svg viewBox="0 0 600 400" className="route-map" role="img" aria-label={label}>
      <defs>
        <pattern id="gb-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0 H0 V40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        </pattern>
        <linearGradient id="gb-route" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#43d19a" />
          <stop offset="1" stopColor="#1687ff" />
        </linearGradient>
      </defs>
      <rect width="600" height="400" fill="#0b1320" />
      <rect width="600" height="400" fill="url(#gb-grid)" />
      {/* Simulated roads */}
      <path d="M0 210 H600" stroke="rgba(255,255,255,0.07)" strokeWidth="26" />
      <path d="M380 0 L330 400" stroke="rgba(255,255,255,0.07)" strokeWidth="20" />
      <path d="M0 120 C 200 140, 380 60, 600 40" stroke="rgba(255,255,255,0.05)" strokeWidth="14" fill="none" />
      <path d="M120 400 L200 0" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
      {/* Route */}
      <path ref={pathRef} d={ROUTE_PATHS[alt] ?? ROUTE_PATHS[0]} fill="none" stroke="url(#gb-route)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="60" cy="330" r="11" fill="#43d19a" stroke="#fff" strokeWidth="3" />
      <circle cx="540" cy="90" r="13" fill="#1687ff" stroke="#fff" strokeWidth="3" />
      <g transform={`translate(${pt.x} ${pt.y})`}>
        <circle r="22" fill="rgba(22,135,255,0.25)" />
        <circle r="9" fill="#1687ff" stroke="#fff" strokeWidth="3" />
      </g>
    </svg>
  );
}
