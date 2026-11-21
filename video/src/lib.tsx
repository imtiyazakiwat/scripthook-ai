import React from 'react';
import {interpolate, spring, Easing, useCurrentFrame, useVideoConfig} from 'remotion';
import timeline from './timeline.json';

export const FPS = 30;
export const TOTAL_FRAMES = Math.ceil(timeline.duration * FPS);

export type Word = {text: string; kw: boolean; t0: number; t1: number};
export type Page = {scene: string; gesture: string; emotion: string; words: Word[]; t0: number; t1: number};
export const PAGES: Page[] = timeline.pages as Page[];

export const f = (sec: number) => Math.round(sec * FPS);

// ---------- scenes ----------
export const SCENE_ORDER = ['hook', 'chain', 'promise', 'axis', 'catch', 'trap', 'roller', 'payoff', 'close', 'cta'] as const;
export type SceneId = (typeof SCENE_ORDER)[number];
export const THEME_OF: Record<SceneId, 'dark' | 'light'> = {
  hook: 'dark', chain: 'dark', promise: 'light', axis: 'dark', catch: 'dark',
  trap: 'light', roller: 'light', payoff: 'light', close: 'dark', cta: 'light',
};
// scene start = first word of scene minus a small lead so the visual change lands with the breath
export const SCENES = SCENE_ORDER.map((id, i) => {
  const ps = PAGES.filter((p) => p.scene === id);
  const start = i === 0 ? 0 : f(ps[0].t0) - 4;
  return {id, start, pages: ps};
}).map((s, i, arr) => ({...s, end: i < arr.length - 1 ? arr[i + 1].start : TOTAL_FRAMES}));

/** absolute frame of the nth occurrence of a word (case-insensitive, punctuation stripped) inside a scene */
export const cue = (scene: SceneId, word: string, nth = 0): number => {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9.]/g, '').replace(/\.+$/, '');
  let k = 0;
  for (const p of PAGES) {
    if (p.scene !== scene) continue;
    for (const w of p.words) {
      if (norm(w.text) === norm(word)) {
        if (k === nth) return f(w.t0);
        k++;
      }
    }
  }
  throw new Error(`cue not found: ${scene}/${word}`);
};

// ---------- palette ----------
export const C = {
  blue: '#3B82F6', blueSoft: 'rgba(59,130,246,0.18)',
  green: '#2EA043', greenBright: '#3FB950', amber: '#D29922', red: '#E5484D', redBright: '#FF5A5F',
  orange: '#F97316',
  dark: {bg: '#0E0F12', grid: 'rgba(255,255,255,0.035)', card: '#17191E', card2: '#1E2128', line: 'rgba(255,255,255,0.09)', text: '#F5F6F8', dim: 'rgba(245,246,248,0.42)', mute: '#8B919C'},
  light: {bg: '#F5F5F4', grid: 'rgba(0,0,0,0.04)', card: '#FFFFFF', card2: '#F4F5F7', line: 'rgba(0,0,0,0.09)', text: '#111317', dim: 'rgba(17,19,23,0.40)', mute: '#6B7280'},
};
export type Theme = typeof C.dark;
export const SANS = '"Plus Jakarta Sans", system-ui, sans-serif';
export const MONO = '"JetBrains Mono", ui-monospace, monospace';

// ---------- motion helpers ----------
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const prog = (frame: number, start: number, dur: number, ease = easeOut) =>
  interpolate(frame, [start, start + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
export const spr = (frame: number, start: number, fps = FPS, damping = 14, mass = 0.6) =>
  spring({frame: frame - start, fps, config: {damping, mass, stiffness: 170}});
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** blur + fade + rise entrance used everywhere (the reference's signature soft entrance) */
export const enter = (frame: number, start: number, dur = 7, dy = 18, blur = 10, scale0 = 0.97): React.CSSProperties => {
  const p = prog(frame, start, dur);
  return {opacity: p, filter: `blur(${(1 - p) * blur}px)`, transform: `translateY(${(1 - p) * dy}px) scale(${lerp(scale0, 1, p)})`};
};
export const exit = (frame: number, start: number, dur = 5): React.CSSProperties => {
  const p = prog(frame, start, dur, Easing.in(Easing.cubic));
  return {opacity: 1 - p, filter: `blur(${p * 10}px)`, transform: `scale(${1 - p * 0.03})`};
};
export const both = (frame: number, a: number, b: number, dy = 18): React.CSSProperties => {
  if (frame < b) return enter(frame, a, 7, dy);
  return exit(frame, b, 5);
};

export const useT = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return {frame, fps};
};

// ---------- shared UI atoms ----------
export const Card: React.FC<{t: Theme; style?: React.CSSProperties; children?: React.ReactNode; pad?: number}> = ({t, style, children, pad = 28}) => (
  <div
    style={{
      background: t.card, borderRadius: 26, border: `1.5px solid ${t.line}`, padding: pad,
      boxShadow: t === C.dark ? '0 30px 80px rgba(0,0,0,0.55)' : '0 30px 70px rgba(15,23,42,0.13), 0 2px 6px rgba(15,23,42,0.06)',
      ...style,
    }}
  >
    {children}
  </div>
);

export const Badge: React.FC<{color: string; children: React.ReactNode; style?: React.CSSProperties; solid?: boolean}> = ({color, children, style, solid}) => (
  <span
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999,
      fontFamily: MONO, fontSize: 24, fontWeight: 700, letterSpacing: 1,
      color: solid ? '#fff' : color, background: solid ? color : `${color}22`, border: `1.5px solid ${color}66`, ...style,
    }}
  >
    {children}
  </span>
);

/** slot-machine digit roll. text may contain digits and separators */
export const Odometer: React.FC<{text: string; start: number; frame: number; size: number; color: string; dur?: number; font?: string; weight?: number}> = ({
  text, start, frame, size, color, dur = 26, font = MONO, weight = 700,
}) => {
  const chars = text.split('');
  let di = 0;
  const nd = chars.filter((c) => /\d/.test(c)).length;
  return (
    <span style={{display: 'inline-flex', fontFamily: font, fontSize: size, fontWeight: weight, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums'}}>
      {chars.map((c, i) => {
        if (!/\d/.test(c)) return <span key={i}>{c}</span>;
        const k = di++;
        const target = Number(c);
        const st = start + k * (8 / Math.max(1, nd)) * 2;
        const p = prog(frame, st, dur - 6, easeOut);
        const spins = 2 + (nd - k);
        const pos = (1 - p) * (spins * 10) + target; // counts down to target
        const blur = clamp(1 - p) * 6;
        return (
          <span key={i} style={{display: 'inline-block', height: size, overflow: 'hidden', position: 'relative', width: '0.62em'}}>
            <span style={{position: 'absolute', left: 0, right: 0, top: 0, transform: `translateY(${-((pos % 10) * size)}px)`, filter: `blur(${blur}px)`}}>
              {Array.from({length: 11}).map((_, j) => (
                <span key={j} style={{display: 'block', height: size, textAlign: 'center'}}>{j % 10}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
};

/** draws a line/path progressively */
export const Draw: React.FC<{d: string; p: number; stroke: string; w?: number; dash?: string; len?: number; opacity?: number}> = ({d, p, stroke, w = 4, len = 2000, opacity = 1}) => (
  <path d={d} fill="none" stroke={stroke} strokeWidth={w} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - p)} opacity={opacity} />
);

/** Figma-style selection frame used on hero elements (echo of the caption keyword box) */
export const Select: React.FC<{p: number; color?: string; pad?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({p, color = C.blue, pad = 10, children, style}) => (
  <span style={{position: 'relative', display: 'inline-block', ...style}}>
    <span
      style={{
        position: 'absolute', left: -pad, top: -pad, bottom: -pad, width: `calc(${p * 100}% + ${2 * pad * p}px)`,
        border: `2.5px solid ${color}`, background: `${color}1f`, opacity: p > 0 ? 1 : 0,
      }}
    />
    {p > 0.95 &&
      [[-pad, -pad], [-pad, 'b'], ['r', -pad], ['r', 'b']].map(([x, y], i) => (
        <span
          key={i}
          style={{
            position: 'absolute', width: 12, height: 12, background: '#fff', border: `2.5px solid ${color}`,
            left: x === 'r' ? undefined : (x as number) - 6, right: x === 'r' ? -pad - 6 : undefined,
            top: y === 'b' ? undefined : (y as number) - 6, bottom: y === 'b' ? -pad - 6 : undefined,
          }}
        />
      ))}
    {children}
  </span>
);
