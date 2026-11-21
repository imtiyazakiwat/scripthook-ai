import React from 'react';
import {PAGES, f, spr, lerp, clamp, prog, FPS} from './lib';
import env from './envelope.json';

/* =====================================================================
   "Kai" — original presenter mascot for this channel.
   Flat-vector rig: two-bone IK arms, per-finger extension, 9 emotions,
   audio-driven lip-sync, blinks, keyword nods, idle breathing, props.
   Local space: viewBox 600 x 640, shoulders at y=385.
   ===================================================================== */

const SKIN = '#F1C09A', SKIN_SH = '#DFA47C', SKIN_LINE = '#C68962';
const HOODIE = '#F97316', HOODIE_SH = '#D95F0B', HOODIE_DK = '#B84E08';
const HAIR = '#22263A', HAIR_HI = '#3A4060', STREAK = '#2DD4BF';
const HEADSET = '#2B2F3A';

type Fingers = [number, number, number, number, number]; // thumb,index,middle,ring,pinky extension 0..1
type ArmPose = {x: number; y: number; rot: number; fingers: Fingers; scale?: number; prop?: Prop; ew?: number};
type Prop = 'magnifier' | 'phone' | 'warning' | 'none';
type Pose = {L: ArmPose; R: ArmPose; shoulderLift?: number; headTilt?: number; lookX?: number; lookY?: number; wag?: number; wave?: number; rub?: number; press?: number};

const F = {
  open: [1, 1, 1, 1, 1] as Fingers,
  relaxed: [0.5, 0.55, 0.5, 0.45, 0.4] as Fingers,
  point: [0.15, 1, 0, 0, 0] as Fingers,
  fist: [0.1, 0, 0, 0, 0] as Fingers,
  thumb: [1, 0, 0, 0, 0] as Fingers,
  one: [0.1, 1, 0, 0, 0] as Fingers,
  two: [0.1, 1, 1, 0, 0] as Fingers,
  four: [0.05, 1, 1, 1, 1] as Fingers,
  grip: [0.45, 0.15, 0.15, 0.15, 0.15] as Fingers,
};
const IDLE_L: ArmPose = {x: 168, y: 720, rot: 176, fingers: F.relaxed};
const IDLE_R: ArmPose = {x: 432, y: 720, rot: 184, fingers: F.relaxed};

const POSES: Record<string, Pose> = {
  idle: {L: IDLE_L, R: IDLE_R},
  present_l: {L: {x: 96, y: 500, rot: -62, fingers: F.open}, R: IDLE_R, headTilt: -4, lookX: -4},
  present_r: {L: IDLE_L, R: {x: 504, y: 500, rot: 62, fingers: F.open}, headTilt: 4, lookX: 4},
  point_up: {L: IDLE_L, R: {x: 452, y: 248, rot: 4, fingers: F.point}, headTilt: 3},
  point_card: {L: {x: 128, y: 262, rot: -38, fingers: F.point}, R: IDLE_R, headTilt: -5, lookX: -6, lookY: -7},
  count1: {L: IDLE_L, R: {x: 458, y: 240, rot: 0, fingers: F.one}},
  count2: {L: IDLE_L, R: {x: 458, y: 240, rot: 0, fingers: F.two}},
  count4: {L: IDLE_L, R: {x: 458, y: 240, rot: 0, fingers: F.four}},
  hands_head: {L: {x: 212, y: 150, rot: 38, fingers: F.open, ew: 0.3}, R: {x: 388, y: 150, rot: -38, fingers: F.open, ew: 0.3}, shoulderLift: 10},
  shrug: {L: {x: 104, y: 500, rot: -80, fingers: F.open}, R: {x: 496, y: 500, rot: 80, fingers: F.open}, shoulderLift: 16, headTilt: 7},
  stop: {L: IDLE_L, R: {x: 446, y: 318, rot: 0, fingers: F.open, scale: 1.12}, headTilt: -3},
  wag: {L: IDLE_L, R: {x: 446, y: 262, rot: 0, fingers: F.point}, wag: 1},
  think: {L: {x: 262, y: 338, rot: -28, fingers: F.point}, R: IDLE_R, headTilt: -7, lookX: 5, lookY: -6},
  thumbs_up: {L: IDLE_L, R: {x: 452, y: 330, rot: -30, fingers: F.thumb, scale: 1.08}},
  rub_hands: {L: {x: 276, y: 470, rot: 78, fingers: F.open}, R: {x: 324, y: 470, rot: -78, fingers: F.open}, rub: 1, lookX: 2},
  warn: {L: IDLE_L, R: {x: 452, y: 306, rot: 0, fingers: F.grip, prop: 'warning'}},
  switch: {L: {x: 132, y: 296, rot: -32, fingers: F.point}, R: IDLE_R, press: 1, lookX: -6, lookY: -6},
  magnify: {L: IDLE_L, R: {x: 392, y: 318, rot: -30, fingers: F.grip, prop: 'magnifier'}},
  arms_crossed: {L: {x: 372, y: 474, rot: -96, fingers: F.fist}, R: {x: 228, y: 486, rot: 96, fingers: F.fist}, headTilt: -2},
  point_out: {L: IDLE_L, R: {x: 372, y: 420, rot: -16, fingers: F.point, scale: 1.35}, lookY: 1},
  wave: {L: IDLE_L, R: {x: 470, y: 226, rot: 14, fingers: F.open}, wave: 1, headTilt: 4},
  phone: {L: IDLE_L, R: {x: 404, y: 476, rot: 0, fingers: F.grip, prop: 'phone'}, lookX: 3, lookY: 3},
};

type Face = {browY: number; browTilt: number; browAsym: number; eyeOpen: number; smile: number; o: number; blush: number};
const FACES: Record<string, Face> = {
  neutral: {browY: 0, browTilt: 0, browAsym: 0, eyeOpen: 1, smile: 0.25, o: 0, blush: 0.15},
  serious: {browY: -4, browTilt: -9, browAsym: 0, eyeOpen: 0.92, smile: 0, o: 0, blush: 0.1},
  alarmed: {browY: 11, browTilt: 9, browAsym: 0, eyeOpen: 1.22, smile: -0.25, o: 0.2, blush: 0.1},
  shocked: {browY: 16, browTilt: 11, browAsym: 0, eyeOpen: 1.35, smile: -0.3, o: 1, blush: 0.1},
  confident: {browY: 2, browTilt: -3, browAsym: 5, eyeOpen: 1, smile: 0.6, o: 0, blush: 0.2},
  mischief: {browY: 0, browTilt: -6, browAsym: 13, eyeOpen: 0.82, smile: 0.5, o: 0, blush: 0.25},
  annoyed: {browY: -6, browTilt: -15, browAsym: 0, eyeOpen: 0.7, smile: -0.2, o: 0, blush: 0.1},
  worried: {browY: 6, browTilt: 17, browAsym: 0, eyeOpen: 1.05, smile: -0.35, o: 0, blush: 0.1},
  happy: {browY: 6, browTilt: 2, browAsym: 0, eyeOpen: 0.72, smile: 0.9, o: 0, blush: 0.35},
};

// ---------- math ----------
const rad = (d: number) => (d * Math.PI) / 180;
const SH_L = {x: 195, y: 385}, SH_R = {x: 405, y: 385};
const L1 = 122, L2 = 114;
const ik = (S: {x: number; y: number}, T: {x: number; y: number}, side: -1 | 1, ew = 2) => {
  let dx = T.x - S.x, dy = T.y - S.y;
  let d = Math.hypot(dx, dy);
  const maxD = L1 + L2 - 2, minD = Math.abs(L1 - L2) + 20;
  const dd = clamp(d, minD, maxD);
  const a = Math.atan2(dy, dx);
  const b = Math.acos(clamp((L1 * L1 + dd * dd - L2 * L2) / (2 * L1 * dd), -1, 1));
  const c1 = {x: S.x + L1 * Math.cos(a + b), y: S.y + L1 * Math.sin(a + b)};
  const c2 = {x: S.x + L1 * Math.cos(a - b), y: S.y + L1 * Math.sin(a - b)};
  // elbow goes outward (away from body centre) and prefers down
  const score = (p: {x: number; y: number}) => side * (p.x - 300) + ew * p.y;
  const E = score(c1) > score(c2) ? c1 : c2;
  const W = {x: S.x + (dx / d) * dd, y: S.y + (dy / d) * dd};
  return {E, W};
};
const mixArm = (a: ArmPose, b: ArmPose, t: number): ArmPose => ({
  x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), rot: lerp(a.rot, b.rot, t),
  fingers: a.fingers.map((v, i) => lerp(v, b.fingers[i], clamp(t))) as Fingers,
  scale: lerp(a.scale ?? 1, b.scale ?? 1, t),
  prop: t < 0.5 ? a.prop : b.prop,
  ew: lerp(a.ew ?? 2, b.ew ?? 2, clamp(t)),
});
const mixFace = (a: Face, b: Face, t: number): Face =>
  Object.fromEntries(Object.keys(a).map((k) => [k, lerp((a as any)[k], (b as any)[k], t)])) as Face;
const n = (v: number | undefined) => v ?? 0;

// ---------- timeline lookups ----------
const GEST = PAGES.map((p) => ({start: f(p.t0) - 6, gesture: p.gesture, emotion: p.emotion, kws: p.words.filter((w) => w.kw).map((w) => f(w.t0))}));
const KW_FRAMES = GEST.flatMap((g) => g.kws);
const bump = (x: number, len = 9) => (x < 0 || x > len ? 0 : Math.sin((x / len) * Math.PI));
// pseudo-random blink schedule
const BLINKS: number[] = [];
{
  let t = 40, s = 7;
  while (t < 5000) {
    BLINKS.push(t);
    s = (s * 9301 + 49297) % 233280;
    t += 70 + Math.floor((s / 233280) * 80);
  }
}

// ---------- drawing ----------
const Hand: React.FC<{p: ArmPose; mirror: 1 | -1; frame: number}> = ({p, mirror, frame}) => {
  const [th, ix, md, rg, pk] = p.fingers;
  const fx = [-15, -4.5, 6.5, 16.5];
  const lens = [40, 46, 42, 33];
  const exts = [ix, md, rg, pk];
  const finger = (i: number) => {
    const L = lerp(9, lens[i], exts[i]);
    const x = fx[i] * mirror;
    return <rect key={i} x={x - 6.8} y={-18 - L} width={13.6} height={L + 10} rx={6.8} fill={SKIN} stroke={SKIN_LINE} strokeWidth={2.4} />;
  };
  // thumb: extended -> sticks out sideways/up ; curled -> tucked across palm
  const thAng = lerp(70, -38, th) * mirror;
  const thLen = lerp(16, 40, th);
  return (
    <g>
      {p.prop === 'magnifier' && (
        <g>
          <rect x={-7} y={-112} width={14} height={78} rx={6} fill="#5B4636" />
          <circle cx={0} cy={-150} r={46} fill="rgba(170,220,255,0.28)" stroke="#343A46" strokeWidth={10} />
          <path d={`M -22 -170 A 30 30 0 0 1 8 -182`} stroke="rgba(255,255,255,0.8)" strokeWidth={6} fill="none" strokeLinecap="round" />
        </g>
      )}
      {p.prop === 'warning' && (
        <g>
          <rect x={-6} y={-90} width={12} height={70} rx={5} fill="#5B4636" />
          <path d="M 0 -200 L 62 -92 L -62 -92 Z" fill="#FACC15" stroke="#1F2937" strokeWidth={8} strokeLinejoin="round" />
          <rect x={-6} y={-170} width={12} height={44} rx={6} fill="#1F2937" />
          <circle cx={0} cy={-112} r={7} fill="#1F2937" />
        </g>
      )}
      {p.prop === 'phone' && (
        <g transform="translate(0,-60)">
          <rect x={-46} y={-80} width={92} height={160} rx={16} fill="#111318" stroke="#3A3F4B" strokeWidth={4} />
          <rect x={-38} y={-68} width={76} height={136} rx={9} fill="#1B2A44" />
          <rect x={-28} y={-56} width={56} height={10} rx={5} fill={'#3B82F6'} opacity={0.9} />
          <rect x={-28} y={-38} width={40} height={8} rx={4} fill="#ffffff" opacity={0.5} />
          <rect x={-28} y={-24} width={50} height={8} rx={4} fill="#ffffff" opacity={0.35} />
          <circle cx={0} cy={36} r={14} fill={'#3B82F6'} opacity={0.5 + 0.5 * Math.abs(Math.sin(frame / 6))} />
        </g>
      )}
      {exts.map((_, i) => finger(i))}
      <rect x={-25} y={-24} width={50} height={50} rx={20} fill={SKIN} stroke={SKIN_LINE} strokeWidth={2.6} />
      <g transform={`translate(${-22 * mirror},4) rotate(${thAng})`}>
        <rect x={-7.5} y={-thLen} width={15} height={thLen + 8} rx={7.5} fill={SKIN} stroke={SKIN_LINE} strokeWidth={2.4} />
      </g>
      <path d={`M ${-13 * mirror} 8 Q 0 15 ${13 * mirror} 8`} stroke={SKIN_SH} strokeWidth={3} fill="none" strokeLinecap="round" />
    </g>
  );
};

const Arm: React.FC<{S: {x: number; y: number}; p: ArmPose; side: -1 | 1; frame: number; dy: number}> = ({S, p, side, frame, dy}) => {
  const S2 = {x: S.x, y: S.y + dy};
  const {E, W} = ik(S2, {x: p.x, y: p.y}, side, p.ew ?? 2);
  const fa = Math.atan2(W.y - E.y, W.x - E.x);
  const cuff = {x: W.x - Math.cos(fa) * 14, y: W.y - Math.sin(fa) * 14};
  return (
    <g>
      <path d={`M ${S2.x} ${S2.y} L ${E.x} ${E.y} L ${cuff.x} ${cuff.y}`} stroke={HOODIE_DK} strokeWidth={70} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={`M ${S2.x} ${S2.y} L ${E.x} ${E.y} L ${cuff.x} ${cuff.y}`} stroke={HOODIE} strokeWidth={63} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* sleeve shading crease */}
      <path d={`M ${lerp(S2.x, E.x, 0.55)} ${lerp(S2.y, E.y, 0.55)} L ${E.x} ${E.y}`} stroke={HOODIE_SH} strokeWidth={14} strokeLinecap="round" opacity={0.55} />
      <line x1={cuff.x} y1={cuff.y} x2={W.x - Math.cos(fa) * 2} y2={W.y - Math.sin(fa) * 2} stroke={HOODIE_DK} strokeWidth={56} strokeLinecap="round" />
      <g transform={`translate(${W.x + Math.cos(fa) * 18},${W.y + Math.sin(fa) * 18}) rotate(${p.rot}) scale(${1.16 * (p.scale ?? 1)})`}>
        <Hand p={p} mirror={side === -1 ? 1 : -1} frame={frame} />
      </g>
    </g>
  );
};

export const Character: React.FC<{frame: number; darkBg: boolean; force?: {gesture: string; emotion: string}}> = ({frame, darkBg, force}) => {
  // ---- gesture blend ----
  let gi = -1;
  for (let i = 0; i < GEST.length; i++) if (frame >= GEST[i].start) gi = i;
  if (force) gi = -1;
  const cur = force ? {start: -100, ...force, kws: []} : gi >= 0 ? GEST[gi] : {start: 0, gesture: 'idle', emotion: 'neutral', kws: []};
  const prev = force ? cur : gi > 0 ? GEST[gi - 1] : {start: 0, gesture: 'idle', emotion: 'neutral', kws: []};
  const tp = force ? 1 : gi >= 0 ? spr(frame, cur.start, FPS, 13, 0.55) : 1;
  const tf = force ? 1 : gi >= 0 ? prog(frame, cur.start - 2, 8) : 1;
  const A = POSES[prev.gesture] ?? POSES.idle, B = POSES[cur.gesture] ?? POSES.idle;
  let L = mixArm(A.L, B.L, tp), R = mixArm(A.R, B.R, tp);
  const mixN = (k: keyof Pose) => lerp(n(A[k] as number), n(B[k] as number), clamp(tp));
  const local = frame - cur.start;
  // procedural secondary motion
  const wag = mixN('wag'), wave = mixN('wave'), rub = mixN('rub'), press = mixN('press');
  R = {...R, rot: R.rot + wag * Math.sin(local * 0.55) * 16 + wave * Math.sin(local * 0.42) * 20};
  if (rub) {
    L = {...L, x: L.x + Math.sin(local * 0.7) * 7 * rub, y: L.y + Math.cos(local * 0.7) * 3 * rub};
    R = {...R, x: R.x - Math.sin(local * 0.7) * 7 * rub};
  }
  if (press) {
    const pp = bump(local - 6, 10) * press;
    L = {...L, x: L.x - pp * 10, y: L.y - pp * 10};
  }
  const face = mixFace(FACES[prev.emotion] ?? FACES.neutral, FACES[cur.emotion] ?? FACES.neutral, tf);

  // ---- body / head motion ----
  const breathe = Math.sin(frame / 24) * 2.2;
  const shoulderLift = mixN('shoulderLift');
  const nod = KW_FRAMES.reduce((acc, k) => acc + bump(frame - k, 9), 0);
  const gestureKick = bump(local, 10) * 3; // small body lean when a gesture starts
  const headTilt = mixN('headTilt') + Math.sin(frame / 37) * 1.6 + wag * Math.sin(local * 0.55) * 3;
  const headDy = Math.sin(frame / 19) * 2 + nod * 5 - shoulderLift * 0.4;
  const lookX = mixN('lookX') + Math.sin(frame / 41) * 1.2;
  const lookY = mixN('lookY');

  // ---- blink ----
  let blink = 0;
  for (const b of BLINKS) {
    const x = frame - b;
    if (x >= 0 && x <= 5) blink = Math.max(blink, bump(x, 5));
  }
  // ---- mouth (lip-sync) ----
  const ei = clamp(frame, 0, env.open.length - 1);
  const open = env.open[ei] ?? 0;
  const bright = env.bright[ei] ?? 0;
  const openH = open * 28;
  const mouthW = 50 * (1 + face.smile * 0.12) * lerp(1, 0.62, face.o) * (1 + (bright - 0.12) * 0.9) * lerp(1, 0.85, open * 0.6);
  const smileC = face.smile * 10;
  const oH = Math.max(openH, face.o * 30);

  const eyeOpen = face.eyeOpen * (1 - blink);
  const MX = 300, MY = 274;
  const mouthPath = (() => {
    const w = mouthW / 2;
    const top = MY - oH * 0.28 - (face.o > 0.5 ? 4 : 0);
    const bot = MY + oH * 0.78;
    const cy = MY - smileC * 0.6;
    if (oH < 2.5) {
      return {closed: `M ${MX - w} ${cy - smileC * 0.4} Q ${MX} ${MY + smileC * 0.8} ${MX + w + face.browAsym * 0.15} ${cy - smileC * 0.4 - face.browAsym * 0.1}`, open: null as string | null};
    }
    return {
      closed: null,
      open: `M ${MX - w} ${cy} Q ${MX} ${top - smileC * 0.2} ${MX + w} ${cy} Q ${MX} ${bot + smileC * 0.6} ${MX - w} ${cy} Z`,
    };
  })();

  const brow = (cx: number, side: -1 | 1) => {
    const raise = face.browY + (side === 1 ? face.browAsym : 0) + nod * 2;
    const ang = face.browTilt * -side; // inner end up when tilt>0
    return (
      <g transform={`translate(${cx},${172 - raise}) rotate(${ang})`}>
        <rect x={-25} y={-6.5} width={50} height={13} rx={6.5} fill={HAIR} />
      </g>
    );
  };
  const eye = (cx: number) => (
    <g>
      <ellipse cx={cx} cy={212} rx={21} ry={Math.max(1.5, 24 * eyeOpen)} fill="#fff" stroke={SKIN_LINE} strokeWidth={2} />
      <clipPath id={`eye${cx}`}>
        <ellipse cx={cx} cy={212} rx={21} ry={Math.max(0.1, 24 * eyeOpen)} />
      </clipPath>
      <g clipPath={`url(#eye${cx})`}>
        <circle cx={cx + lookX} cy={214 + lookY} r={14} fill="#4A3424" />
        <circle cx={cx + lookX} cy={214 + lookY} r={7.5} fill="#120C08" />
        <circle cx={cx + lookX + 5} cy={208 + lookY} r={4.2} fill="#fff" />
        {/* upper lid shadow */}
        <rect x={cx - 24} y={212 - 24 * eyeOpen - 2} width={48} height={7} fill={SKIN_SH} opacity={0.6} />
      </g>
      {blink > 0.85 && <path d={`M ${cx - 20} 213 Q ${cx} 219 ${cx + 20} 213`} stroke={SKIN_LINE} strokeWidth={3.5} fill="none" strokeLinecap="round" />}
    </g>
  );

  const sl = shoulderLift;
  return (
    <svg viewBox="0 0 600 640" width={600} height={640} style={{overflow: 'visible'}}>
      <defs>
        <radialGradient id="glow" cx="50%" cy="60%" r="50%">
          <stop offset="0%" stopColor={darkBg ? 'rgba(249,115,22,0.22)' : 'rgba(249,115,22,0.10)'} />
          <stop offset="100%" stopColor="rgba(249,115,22,0)" />
        </radialGradient>
        <linearGradient id="hoodie" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FB8A3C" />
          <stop offset="1" stopColor={HOODIE_SH} />
        </linearGradient>
      </defs>
      <ellipse cx={300} cy={430} rx={330} ry={300} fill="url(#glow)" />
      <g transform={`translate(0,${breathe * 0.6 + gestureKick})`}>
        {/* ---- torso ---- */}
        <path
          d={`M 300 ${330} C 240 ${334} 196 ${352 - sl} 172 ${380 - sl} C 140 ${415 - sl} 128 470 122 640 L 478 640 C 472 470 460 ${415 - sl} 428 ${380 - sl} C 404 ${352 - sl} 360 ${334} 300 ${330} Z`}
          fill="url(#hoodie)" stroke={HOODIE_DK} strokeWidth={3}
        />
        {/* hood collar behind neck */}
        <path d={`M 226 ${350 - sl * 0.5} C 240 398 360 398 374 ${350 - sl * 0.5} C 360 330 240 330 226 ${350 - sl * 0.5} Z`} fill={HOODIE_SH} />
        {/* neck */}
        <path d="M 270 286 L 270 352 Q 300 372 330 352 L 330 286 Z" fill={SKIN_SH} />
        <path d={`M 236 ${352 - sl * 0.5} C 262 388 338 388 364 ${352 - sl * 0.5}`} stroke={HOODIE_DK} strokeWidth={6} fill="none" strokeLinecap="round" />
        {/* drawstrings */}
        <path d="M 278 378 Q 274 420 280 470" stroke="#FFF4E8" strokeWidth={6} fill="none" strokeLinecap="round" />
        <path d="M 322 378 Q 326 420 320 470" stroke="#FFF4E8" strokeWidth={6} fill="none" strokeLinecap="round" />
        <rect x={274} y={466} width={12} height={20} rx={4} fill="#CBD5E1" />
        <rect x={314} y={466} width={12} height={20} rx={4} fill="#CBD5E1" />
        {/* chest shield logo */}
        <g transform="translate(370,430) scale(1.05)">
          <path d="M0 -20 L16 -14 V-3 C16 7 9 13 0 16 C-9 13 -16 7 -16 -3 V-14 Z" fill="none" stroke="#FFF4E8" strokeWidth={3.5} strokeLinejoin="round" />
          <path d="M-6 -2 L-1 3 L7 -6" fill="none" stroke="#FFF4E8" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
        </g>
        {/* pocket seam */}
        <path d="M 200 600 Q 300 585 400 600" stroke={HOODIE_DK} strokeWidth={4} fill="none" opacity={0.6} />

        {/* ---- head ---- */}
        <g transform={`translate(0,${headDy}) rotate(${headTilt} 300 290)`}>
          {/* back hair */}
          <path d="M 196 214 C 186 120 240 86 300 86 C 368 86 416 122 404 214 C 400 170 380 150 300 150 C 220 150 200 170 196 214 Z" fill={HAIR} />
          {/* ears */}
          <ellipse cx={208} cy={222} rx={17} ry={24} fill={SKIN} stroke={SKIN_LINE} strokeWidth={2.5} />
          <ellipse cx={392} cy={222} rx={17} ry={24} fill={SKIN} stroke={SKIN_LINE} strokeWidth={2.5} />
          {/* face */}
          <path d="M 210 200 C 210 132 250 112 300 112 C 350 112 390 132 390 200 C 390 262 356 312 300 312 C 244 312 210 262 210 200 Z" fill={SKIN} stroke={SKIN_LINE} strokeWidth={3} />
          {/* jaw shade */}
          <path d="M 226 262 C 246 300 354 300 374 262 C 360 302 330 314 300 314 C 270 314 240 302 226 262 Z" fill={SKIN_SH} opacity={0.5} />
          {/* blush */}
          <ellipse cx={248} cy={252} rx={18} ry={10} fill="#F28B82" opacity={face.blush} />
          <ellipse cx={352} cy={252} rx={18} ry={10} fill="#F28B82" opacity={face.blush} />
          {/* hair front: swoop with teal streak */}
          <path d="M 204 196 C 196 128 246 96 306 98 C 362 100 404 130 396 194 C 384 160 360 146 330 146 C 344 160 346 170 340 178 C 316 150 268 140 236 160 C 220 170 210 182 204 196 Z" fill={HAIR} stroke={darkBg ? HAIR_HI : HAIR} strokeWidth={3} />
          <path d="M 262 108 C 300 102 340 112 360 134 C 334 124 300 122 276 130 Z" fill={STREAK} />
          {/* headset band */}
          <path d="M 196 222 C 186 96 414 96 404 222" stroke={HEADSET} strokeWidth={12} fill="none" strokeLinecap="round" />
          <rect x={186} y={196} width={30} height={54} rx={13} fill={HEADSET} />
          <rect x={384} y={196} width={30} height={54} rx={13} fill={HEADSET} />
          <rect x={190} y={206} width={8} height={34} rx={4} fill={'#F97316'} />
          <rect x={402} y={206} width={8} height={34} rx={4} fill={'#F97316'} />
          {/* mic boom */}
          <path d="M 202 246 C 210 290 236 300 262 294" stroke={HEADSET} strokeWidth={7} fill="none" strokeLinecap="round" />
          <rect x={258} y={287} width={20} height={14} rx={7} fill={HEADSET} />
          {/* brows, eyes, nose, mouth */}
          {brow(262, -1)}
          {brow(338, 1)}
          {eye(264)}
          {eye(336)}
          <path d="M 300 226 Q 292 248 300 252 Q 306 254 310 250" stroke={SKIN_LINE} strokeWidth={3.5} fill="none" strokeLinecap="round" />
          {mouthPath.closed && <path d={mouthPath.closed} stroke="#7A2E2A" strokeWidth={5} fill="none" strokeLinecap="round" />}
          {mouthPath.open && (
            <g>
              <clipPath id="mouthclip">
                <path d={mouthPath.open} />
              </clipPath>
              <path d={mouthPath.open} fill="#5B1E1E" stroke="#7A2E2A" strokeWidth={3.5} strokeLinejoin="round" />
              <g clipPath="url(#mouthclip)">
                <rect x={MX - 40} y={MY - oH * 0.28 - 14} width={80} height={14 + Math.min(9, oH * 0.25)} fill="#fff" />
                <ellipse cx={MX} cy={MY + oH * 0.78} rx={mouthW * 0.32} ry={Math.max(4, oH * 0.3)} fill="#E26D6D" />
              </g>
            </g>
          )}
        </g>

        {/* ---- arms (drawn over head so hands can touch face/head) ---- */}
        <Arm S={SH_L} p={L} side={-1} frame={frame} dy={-sl} />
        <Arm S={SH_R} p={R} side={1} frame={frame} dy={-sl} />
      </g>
    </svg>
  );
};
