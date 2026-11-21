import React from 'react';
import {C, MONO, SCENES, SceneId, THEME_OF, prog, spr, Odometer} from './lib';

const CHAPTERS: {label: string; scenes: SceneId[]}[] = [
  {label: 'ATTACK', scenes: ['hook', 'chain']},
  {label: 'AXIS', scenes: ['axis', 'catch']},
  {label: 'ROLLER', scenes: ['trap', 'roller', 'payoff']},
  {label: 'CHECK', scenes: ['close', 'cta']},
];
// corner stat per scene (persists the key number like the reference's top-right counter)
const STAT: Partial<Record<SceneId, [string, string]>> = {
  chain: ['T+12h', 'to M365'],
  promise: ['2', 'apache bugs'],
  axis: ['9.8', 'CVSS'],
  catch: ['9.2.28', 'confluence fix'],
  trap: ['9.8', 'CVSS'],
  roller: ['9.8', 'CVSS'],
  payoff: ['6.1.6+', 'roller fix'],
  close: ['2', 'to search'],
};

export const Logo: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <path d="M20 3 L35 9 V19 C35 28.5 28.5 35 20 38 C11.5 35 5 28.5 5 19 V9 Z" fill="none" stroke={color} strokeWidth={3.2} strokeLinejoin="round" />
    <path d="M14 20 L18.5 24.5 L27 15.5" fill="none" stroke={color} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Tracker: React.FC<{frame: number}> = ({frame}) => {
  const scene = SCENES.find((s) => frame >= s.start && frame < s.end)!;
  if (scene.id === 'hook') return null;
  const t = THEME_OF[scene.id] === 'dark' ? C.dark : C.light;
  const showStart = SCENES.find((s) => s.id === 'chain')!.start;
  const appear = prog(frame, showStart, 10);
  const activeIdx = CHAPTERS.findIndex((c) => c.scenes.includes(scene.id));
  const x0 = 150, x1 = 830;
  const xs = CHAPTERS.map((_, i) => x0 + ((x1 - x0) * i) / (CHAPTERS.length - 1));
  // the progress line fills to the active chapter
  const chStart = (i: number) => SCENES.find((s) => s.id === CHAPTERS[i].scenes[0])!.start;
  const stat = STAT[scene.id];
  return (
    <div style={{position: 'absolute', top: 520, left: 0, right: 0, height: 90, opacity: appear, filter: `blur(${(1 - appear) * 8}px)`}}>
      <div style={{position: 'absolute', left: 52, top: 4}}>
        <Logo size={46} color={t.text} />
      </div>
      <svg width={1080} height={90} style={{position: 'absolute', left: 0, top: 0}}>
        <line x1={110} y1={27} x2={x1 + 40} y2={27} stroke={t.line} strokeWidth={3} />
        {CHAPTERS.map((c, i) => {
          if (i > activeIdx) return null;
          const p = i < activeIdx ? 1 : prog(frame, chStart(i), 12);
          const from = i === 0 ? 110 : xs[i - 1];
          return <line key={i} x1={from} y1={27} x2={from + (xs[i] - from) * p} y2={27} stroke={C.greenBright} strokeWidth={3} />;
        })}
        {CHAPTERS.map((c, i) => {
          const done = i < activeIdx;
          const act = i === activeIdx;
          const pop = act ? spr(frame, chStart(i)) : 1;
          const r = act ? 9 + 3 * pop : 8;
          return (
            <g key={i}>
              {act && <circle cx={xs[i]} cy={27} r={22 * pop} fill={C.greenBright} opacity={0.16} />}
              <circle cx={xs[i]} cy={27} r={r} fill={done || act ? C.greenBright : t.card} stroke={done || act ? C.greenBright : t.mute} strokeWidth={2.5} />
            </g>
          );
        })}
      </svg>
      {CHAPTERS.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute', top: 50, left: xs[i] - 80, width: 160, textAlign: 'center', fontFamily: MONO, fontSize: 19, letterSpacing: 2,
            fontWeight: 700, color: i === activeIdx ? t.text : t.mute,
          }}
        >
          {c.label}
        </div>
      ))}
      {stat && (
        <div style={{position: 'absolute', right: 40, top: -6, textAlign: 'right'}}>
          <div key={scene.id} style={{fontFamily: MONO, fontWeight: 700, fontSize: 30, color: t.text}}>
            <Odometer text={stat[0]} start={scene.start + 6} frame={frame} size={30} color={t.text} dur={20} />
          </div>
          <div style={{fontFamily: MONO, fontSize: 15, color: t.mute, letterSpacing: 1}}>{stat[1]}</div>
        </div>
      )}
    </div>
  );
};
