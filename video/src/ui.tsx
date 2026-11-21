import React from 'react';
import {C, MONO, SANS, Theme, prog, spr, lerp, clamp} from './lib';

/** a panel that is visible in [a,b) with the soft blur entrance/exit */
export const Panel: React.FC<{frame: number; a: number; b: number; children: React.ReactNode; style?: React.CSSProperties; dy?: number}> = ({frame, a, b, children, style, dy = 24}) => {
  if (frame < a - 1 || frame > b + 6) return null;
  const pin = prog(frame, a, 8);
  const pout = prog(frame, b, 6);
  const o = pin * (1 - pout);
  return (
    <div
      style={{
        position: 'absolute', inset: 0, opacity: o, filter: `blur(${(1 - pin) * 12 + pout * 12}px)`,
        transform: `translateY(${(1 - pin) * dy - pout * 10}px) scale(${lerp(0.96, 1, pin) - pout * 0.03})`, ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Stamp: React.FC<{frame: number; at: number; text: string; color: string; size?: number; rot?: number; style?: React.CSSProperties}> = ({frame, at, text, color, size = 64, rot = -8, style}) => {
  if (frame < at) return null;
  const s = spr(frame, at, 30, 11, 0.5);
  return (
    <div
      style={{
        position: 'absolute', fontFamily: SANS, fontWeight: 800, fontSize: size, color, border: `${size / 9}px solid ${color}`, borderRadius: 14,
        padding: `${size * 0.08}px ${size * 0.3}px`, letterSpacing: 2, transform: `rotate(${rot}deg) scale(${lerp(2.2, 1, s)})`, opacity: clamp(s * 1.5),
        background: 'rgba(0,0,0,0.02)', whiteSpace: 'nowrap', ...style,
      }}
    >
      {text}
    </div>
  );
};

export const Window: React.FC<{t: Theme; title: string; children: React.ReactNode; style?: React.CSSProperties; bar?: string}> = ({t, title, children, style, bar}) => (
  <div style={{background: t.card, borderRadius: 22, border: `1.5px solid ${t.line}`, overflow: 'hidden', boxShadow: t === C.dark ? '0 30px 80px rgba(0,0,0,.6)' : '0 30px 70px rgba(15,23,42,.14)', ...style}}>
    <div style={{height: 52, display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', background: bar ?? t.card2, borderBottom: `1.5px solid ${t.line}`}}>
      {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
        <span key={c} style={{width: 14, height: 14, borderRadius: 7, background: c}} />
      ))}
      <span style={{marginLeft: 14, fontFamily: MONO, fontSize: 20, color: t.mute}}>{title}</span>
    </div>
    <div style={{padding: 26}}>{children}</div>
  </div>
);

export const Mono: React.FC<{c?: string; s?: number; w?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({c, s = 24, w = 400, children, style}) => (
  <span style={{fontFamily: MONO, fontSize: s, color: c, fontWeight: w, ...style}}>{children}</span>
);

export const Toggle: React.FC<{on: number; color?: string}> = ({on, color = C.greenBright}) => (
  <div style={{width: 86, height: 46, borderRadius: 23, background: on > 0.5 ? color : '#9CA3AF', position: 'relative', transition: 'none'}}>
    <div style={{position: 'absolute', top: 5, left: lerp(5, 45, on), width: 36, height: 36, borderRadius: 18, background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,.3)'}} />
  </div>
);

export const Cursor: React.FC<{x: number; y: number; click?: number}> = ({x, y, click = 0}) => (
  <div style={{position: 'absolute', left: x, top: y, zIndex: 20}}>
    {click > 0 && <div style={{position: 'absolute', left: -30 * click, top: -30 * click, width: 60 * click, height: 60 * click, borderRadius: '50%', border: `3px solid ${C.blue}`, opacity: 1 - click}} />}
    <svg width={44} height={52} viewBox="0 0 22 26" style={{transform: `scale(${1 - 0.12 * Math.sin(Math.PI * clamp(click * 2))})`}}>
      <path d="M2 2 L2 21 L7 16 L10.5 24 L14 22.5 L10.5 15 L18 15 Z" fill="#fff" stroke="#111" strokeWidth={1.8} strokeLinejoin="round" />
    </svg>
  </div>
);

export const Gauge: React.FC<{frame: number; at: number; value: number; t: Theme}> = ({frame, at, value, t}) => {
  const p = prog(frame, at, 26);
  const v = value * p;
  const ang = -180 + (v / 10) * 180;
  const R = 190;
  const arc = (a0: number, a1: number) => {
    const p0 = [Math.cos((a0 * Math.PI) / 180) * R, Math.sin((a0 * Math.PI) / 180) * R];
    const p1 = [Math.cos((a1 * Math.PI) / 180) * R, Math.sin((a1 * Math.PI) / 180) * R];
    return `M ${p0[0]} ${p0[1]} A ${R} ${R} 0 0 1 ${p1[0]} ${p1[1]}`;
  };
  return (
    <svg width={520} height={300} viewBox="-260 -230 520 300">
      <path d={arc(-180, -108)} stroke={C.greenBright} strokeWidth={34} fill="none" />
      <path d={arc(-106, -72)} stroke={C.amber} strokeWidth={34} fill="none" />
      <path d={arc(-70, -36)} stroke={'#F97316'} strokeWidth={34} fill="none" />
      <path d={arc(-34, 0)} stroke={C.red} strokeWidth={34} fill="none" />
      <g transform={`rotate(${ang})`}>
        <path d="M 0 -10 L 165 0 L 0 10 Z" fill={t.text} />
      </g>
      <circle r={20} fill={t.text} />
      <text x={0} y={62} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={64} fill={v > 9 ? C.redBright : t.text}>
        {v.toFixed(1)}
      </text>
    </svg>
  );
};

export const Typed: React.FC<{frame: number; at: number; text: string; cps?: number; style?: React.CSSProperties; caret?: boolean}> = ({frame, at, text, cps = 38, style, caret = true}) => {
  const n = Math.max(0, Math.floor(((frame - at) / 30) * cps));
  const shown = text.slice(0, n);
  const done = n >= text.length;
  return (
    <span style={style}>
      {frame >= at ? shown : ''}
      {caret && frame >= at && (!done || Math.floor(frame / 12) % 2 === 0) && <span style={{opacity: 0.8}}>▌</span>}
    </span>
  );
};

/* ---------- icons ---------- */
export const ServerIcon: React.FC<{s?: number; c: string; led?: string}> = ({s = 90, c, led = C.greenBright}) => (
  <svg width={s} height={s} viewBox="0 0 48 48">
    {[6, 19, 32].map((y) => (
      <g key={y}>
        <rect x={6} y={y} width={36} height={11} rx={3} fill="none" stroke={c} strokeWidth={2.6} />
        <circle cx={12} cy={y + 5.5} r={2} fill={led} />
        <line x1={20} y1={y + 5.5} x2={36} y2={y + 5.5} stroke={c} strokeWidth={2} opacity={0.5} />
      </g>
    ))}
  </svg>
);
export const DbIcon: React.FC<{s?: number; c: string}> = ({s = 90, c}) => (
  <svg width={s} height={s} viewBox="0 0 48 48">
    <ellipse cx={24} cy={10} rx={15} ry={5} fill="none" stroke={c} strokeWidth={2.6} />
    <path d="M9 10 V38 C9 41 16 43 24 43 C32 43 39 41 39 38 V10" fill="none" stroke={c} strokeWidth={2.6} />
    <path d="M9 19 C9 22 16 24 24 24 C32 24 39 22 39 19 M9 28.5 C9 31.5 16 33.5 24 33.5 C32 33.5 39 31.5 39 28.5" fill="none" stroke={c} strokeWidth={2} opacity={0.6} />
  </svg>
);
export const CloudIcon: React.FC<{s?: number; c: string}> = ({s = 90, c}) => (
  <svg width={s} height={s} viewBox="0 0 48 48">
    <path d="M14 36 H36 C41 36 44 32.5 44 28.5 C44 24 40.5 21 36.5 21 C35.5 15 30.5 11 24.5 11 C18.5 11 14 15 13 20.5 C8 21 5 24.5 5 28.5 C5 32.8 8.5 36 14 36 Z" fill="none" stroke={c} strokeWidth={2.6} strokeLinejoin="round" />
  </svg>
);
export const OfficeIcon: React.FC<{s?: number}> = ({s = 90}) => (
  <svg width={s} height={s} viewBox="0 0 48 48">
    <rect x={6} y={6} width={17} height={17} rx={3} fill="#F25022" />
    <rect x={25} y={6} width={17} height={17} rx={3} fill="#7FBA00" />
    <rect x={6} y={25} width={17} height={17} rx={3} fill="#00A4EF" />
    <rect x={25} y={25} width={17} height={17} rx={3} fill="#FFB900" />
  </svg>
);
export const JarIcon: React.FC<{s?: number; c: string}> = ({s = 90, c}) => (
  <svg width={s} height={s} viewBox="0 0 48 48">
    <rect x={12} y={6} width={24} height={7} rx={2} fill="none" stroke={c} strokeWidth={2.6} />
    <path d="M14 13 H34 C38 17 39 21 39 26 V38 C39 41 37 43 34 43 H14 C11 43 9 41 9 38 V26 C9 21 10 17 14 13 Z" fill="none" stroke={c} strokeWidth={2.6} />
    <text x={24} y={34} textAnchor="middle" fontFamily="JetBrains Mono" fontWeight={700} fontSize={10} fill={c}>
      .jar
    </text>
  </svg>
);
export const Skull: React.FC<{s?: number; c: string}> = ({s = 40, c}) => (
  <svg width={s} height={s} viewBox="0 0 24 24">
    <path d="M12 2 C6.5 2 3 5.8 3 10.5 C3 13.5 4.5 15.6 6.5 16.8 V20 C6.5 21 7.3 21.8 8.3 21.8 H15.7 C16.7 21.8 17.5 21 17.5 20 V16.8 C19.5 15.6 21 13.5 21 10.5 C21 5.8 17.5 2 12 2 Z" fill={c} />
    <circle cx={8.5} cy={11} r={2.4} fill="#000" opacity={0.75} />
    <circle cx={15.5} cy={11} r={2.4} fill="#000" opacity={0.75} />
    <path d="M12 13.5 L10.8 16 H13.2 Z" fill="#000" opacity={0.75} />
  </svg>
);
export const pulse = (frame: number, period = 24) => 0.5 + 0.5 * Math.sin((frame / period) * Math.PI * 2);
