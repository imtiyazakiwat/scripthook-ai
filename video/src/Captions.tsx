import React from 'react';
import {PAGES, Word, f, prog, clamp, C, SANS, THEME_OF, SceneId, lerp} from './lib';

/** Split long spoken pages into caption pages of <= 7 words, breaking after punctuation when possible */
type CapPage = {words: Word[]; start: number; end: number; scene: SceneId};
const buildCaptionPages = (): CapPage[] => {
  const out: {words: Word[]; scene: SceneId}[] = [];
  for (const p of PAGES) {
    let cur: Word[] = [];
    p.words.forEach((w, i) => {
      cur.push(w);
      const rest = p.words.length - i - 1;
      const punct = /[,.?!…]$/.test(w.text);
      if (rest > 0 && ((cur.length >= 4 && punct && rest >= 2) || cur.length >= 7)) {
        out.push({words: cur, scene: p.scene as SceneId});
        cur = [];
      }
    });
    if (cur.length) out.push({words: cur, scene: p.scene as SceneId});
  }
  return out.map((cp, i) => {
    const start = f(cp.words[0].t0) - 1;
    const next = out[i + 1];
    const end = next ? f(next.words[0].t0) - 1 : f(cp.words[cp.words.length - 1].t1) + 40;
    return {...cp, start, end};
  });
};
export const CAPTION_PAGES = buildCaptionPages();

const KwBox: React.FC<{frame: number; start: number; color: string}> = ({frame, start, color}) => {
  const p = prog(frame, start, 5);
  const handles = p > 0.9;
  const pad = 7;
  return (
    <>
      <span
        style={{
          position: 'absolute', left: -pad, top: -2, bottom: -4, width: `calc(${p * 100}% + ${pad * 2 * p}px)`,
          background: C.blueSoft, border: `2.5px solid ${C.blue}`, borderRadius: 3, zIndex: -1,
        }}
      />
      {/* cursor dot */}
      <span style={{position: 'absolute', left: -pad - 7, top: -14, width: 14, height: 14, borderRadius: 7, background: C.blue, opacity: clamp(p * 2)}} />
      {handles &&
        [
          {left: -pad - 6, top: -8},
          {right: -pad - 6, top: -8},
          {left: -pad - 6, bottom: -10},
          {right: -pad - 6, bottom: -10},
        ].map((s, i) => (
          <span key={i} style={{position: 'absolute', width: 11, height: 11, background: color, border: `2.5px solid ${C.blue}`, ...s}} />
        ))}
    </>
  );
};

export const Captions: React.FC<{frame: number}> = ({frame}) => {
  const page = CAPTION_PAGES.find((p) => frame >= p.start && frame < p.end);
  if (!page) return null;
  const t = THEME_OF[page.scene] === 'dark' ? C.dark : C.light;
  const exitP = prog(frame, page.end - 3, 3);
  const visible = page.words.filter((w) => frame >= f(w.t0) - 1);
  // the active word = last visible one
  return (
    <div
      style={{
        position: 'absolute', top: 300, left: 70, right: 70, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: 1 - exitP, filter: `blur(${exitP * 8}px)`,
      }}
    >
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: 17, rowGap: 6, maxWidth: 900, fontFamily: SANS, fontSize: 58, lineHeight: 1.18, letterSpacing: -0.5}}>
        {visible.map((w, i) => {
          const s = f(w.t0) - 1;
          const p = prog(frame, s, 5);
          const isActive = i === visible.length - 1;
          const isKw = w.kw;
          const dimT = isActive ? 0 : prog(frame, f(visible[i + 1].t0) - 1, 5);
          // keywords stay bold & strong; normal words fade to grey once passed
          const color = isKw ? t.text : dimT > 0 ? mix(t.text, t.dim, dimT) : t.text;
          const weight = isKw || isActive ? 800 : dimT > 0.5 ? 500 : 800;
          return (
            <span
              key={i}
              style={{
                position: 'relative', display: 'inline-block', zIndex: 1,
                color, fontWeight: weight,
                opacity: p, filter: `blur(${(1 - p) * 9}px)`, transform: `translateY(${(1 - p) * 10}px)`,
              }}
            >
              {isKw && <KwBox frame={frame} start={s + 1} color={t.card} />}
              {w.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// crude rgba mixer for '#rrggbb' -> 'rgba()' strings
const parse = (c: string): number[] => {
  if (c.startsWith('#')) return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16), 1];
  const m = c.match(/[\d.]+/g)!.map(Number);
  return [m[0], m[1], m[2], m[3] ?? 1];
};
const mix = (a: string, b: string, t: number) => {
  const A = parse(a), B = parse(b);
  return `rgba(${A.map((v, i) => (i < 3 ? Math.round(lerp(v, B[i], t)) : lerp(v, B[i], t).toFixed(3))).join(',')})`;
};
