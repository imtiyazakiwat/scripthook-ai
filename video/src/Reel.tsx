import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {C, SCENES, THEME_OF, prog, lerp, easeInOut} from './lib';
import {Captions} from './Captions';
import {Tracker} from './Tracker';
import {Character} from './Character';
import {Hook, Chain, Promise as PromiseScene, Axis, Catch, Trap, Roller, Payoff, Close, Cta} from './Scenes';

const COMP: Record<string, React.FC<any>> = {hook: Hook, chain: Chain, promise: PromiseScene, axis: Axis, catch: Catch, trap: Trap, roller: Roller, payoff: Payoff, close: Close, cta: Cta};
const HERO = {x: 60, y: 640, w: 960, h: 690};
const TRANS = 7;
const SCALE: Record<string, number> = {hook: 1.0, chain: 1.0, cta: 1.0}; // frames for the card-expand theme flip

const Bg: React.FC<{theme: 'dark' | 'light'; style?: React.CSSProperties}> = ({theme, style}) => {
  const t = theme === 'dark' ? C.dark : C.light;
  return (
    <div
      style={{
        position: 'absolute', background: t.bg,
        backgroundImage: `linear-gradient(${t.grid} 2px, transparent 2px), linear-gradient(90deg, ${t.grid} 2px, transparent 2px)`,
        backgroundSize: '60px 60px', backgroundPosition: '-1px -1px', ...style,
      }}
    />
  );
};

export const Reel: React.FC = () => {
  const frame = useCurrentFrame();
  const si = SCENES.findIndex((s) => frame >= s.start && frame < s.end);
  const scene = SCENES[si];
  const prev = si > 0 ? SCENES[si - 1] : null;
  const theme = THEME_OF[scene.id];
  const flipping = prev && THEME_OF[prev.id] !== theme && frame < scene.start + TRANS;
  const tp = prog(frame, scene.start, TRANS, easeInOut);

  const renderScene = (s: (typeof SCENES)[number], exiting: boolean) => {
    const Comp = COMP[s.id];
    const t = THEME_OF[s.id] === 'dark' ? C.dark : C.light;
    const xo = exiting ? prog(frame, s.end, 6) : 0;
    return (
      <div key={s.id} style={{position: 'absolute', left: 0, top: HERO.y, width: 1080, height: HERO.h, opacity: 1 - xo, filter: `blur(${xo * 14}px)`}}>
        <div style={{position: 'absolute', inset: 0, transform: `scale(${SCALE[s.id] ?? 1.13})`, transformOrigin: '50% 48%'}}>
          <Comp frame={frame} t={t} start={s.start} end={s.end} />
        </div>
      </div>
    );
  };

  // the expanding card: from hero rect to full frame
  const card = {
    left: lerp(HERO.x, 0, tp), top: lerp(HERO.y, 0, tp), width: lerp(HERO.w, 1080, tp), height: lerp(HERO.h, 1920, tp), borderRadius: lerp(26, 0, tp),
  };
  const darkNow = theme === 'dark';

  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Audio src={staticFile('vo.wav')} />
      {flipping ? (
        <>
          <Bg theme={THEME_OF[prev!.id]} style={{inset: 0}} />
          {renderScene(prev!, true)}
          <Bg theme={theme} style={{...card, boxShadow: '0 30px 80px rgba(0,0,0,.4)'}} />
        </>
      ) : (
        <>
          <Bg theme={theme} style={{inset: 0}} />
          {prev && frame < scene.start + 6 && renderScene(prev, true)}
        </>
      )}
      {renderScene(scene, false)}
      <Tracker frame={frame} />
      <Captions frame={frame} />
      <div style={{position: 'absolute', left: 240, top: 1312, width: 600, height: 640}}>
        <Character frame={frame} darkBg={darkNow} />
      </div>
    </AbsoluteFill>
  );
};
