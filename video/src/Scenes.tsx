import React from 'react';
import {C, MONO, SANS, Theme, cue, prog, spr, lerp, clamp, Odometer, Draw, Select, Badge, Card, easeInOut} from './lib';
import {Panel, Stamp, Window, Mono, Toggle, Cursor, Gauge, Typed, ServerIcon, DbIcon, CloudIcon, OfficeIcon, JarIcon, Skull, pulse} from './ui';

type SP = {frame: number; t: Theme; start: number; end: number};
const center: React.CSSProperties = {position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'};

/* ================= HOOK ================= */
export const Hook: React.FC<SP> = ({frame, t, end}) => {
  const drop = spr(frame, 0, 30, 12, 0.7);
  const died = cue('hook', 'died');
  const hackers = cue('hook', 'hackers');
  const now = cue('hook', 'now');
  const crack = prog(frame, hackers, 18);
  const red = prog(frame, hackers, 20);
  // pixel band (threat-map style) behind tombstone
  const cells = Array.from({length: 26 * 5});
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 260, height: 170, display: 'grid', gridTemplateColumns: 'repeat(26, 1fr)', gap: 9, padding: '0 10px', opacity: 0.9}}>
        {cells.map((_, i) => {
          const col = i % 26, row = Math.floor(i / 26);
          const seed = Math.sin(i * 12.9898) * 43758.5453;
          const r = seed - Math.floor(seed);
          const dist = Math.abs(col - 12.5) / 13;
          const on = r > 0.35 + dist * 0.4;
          const flick = Math.sin(frame * 0.3 + i) > 0.6 ? 0.5 : 1;
          const isRed = r > lerp(1.2, 0.55, red) ;
          return (
            <div
              key={i}
              style={{
                aspectRatio: '1', borderRadius: 3,
                background: on ? (isRed ? C.red : C.greenBright) : 'rgba(255,255,255,0.03)',
                opacity: on ? (0.25 + r * 0.6) * flick * prog(frame, row * 2 + Math.abs(col - 13) * 0.6, 10) : 1,
              }}
            />
          );
        })}
      </div>
      {/* shockwave rings */}
      {[0, 7].map((d) => {
        const p = prog(frame, 2 + d, 30, easeInOut);
        return <div key={d} style={{position: 'absolute', left: 540 - 60 - p * 520, top: 340 - 60 - p * 520, width: 120 + p * 1040, height: 120 + p * 1040, borderRadius: '50%', border: `3px solid rgba(255,255,255,${0.35 * (1 - p)})`}} />;
      })}
      {/* tombstone */}
      <div style={{...center, transform: `translateY(${lerp(-260, 0, drop)}px) scale(${lerp(1.25, 1, drop)})`, filter: `blur(${(1 - drop) * 10}px)`}}>
        <div style={{position: 'relative', width: 520, height: 600, transform: `rotate(${crack * -2}deg)`}}>
          <div
            style={{
              position: 'absolute', inset: 0, borderRadius: '260px 260px 26px 26px',
              background: 'linear-gradient(160deg,#5B616E 0%,#363A43 55%,#23262D 100%)',
              boxShadow: `inset 0 6px 0 rgba(255,255,255,.18), 0 40px 90px rgba(0,0,0,.7), 0 0 ${120 * red}px rgba(229,72,77,${0.55 * red})`,
              border: '2px solid rgba(255,255,255,.08)',
            }}
          />
          <div style={{position: 'absolute', top: 120, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 800, color: '#C9CED8', letterSpacing: 10, fontSize: 54}}>R.I.P.</div>
          <div style={{position: 'absolute', top: 206, left: 0, right: 0, textAlign: 'center', fontFamily: MONO, fontWeight: 700, color: '#E7EAF0', fontSize: 50}}>Apache Axis 1.x</div>
          <div style={{position: 'absolute', top: 280, left: 0, right: 0, textAlign: 'center', fontFamily: MONO, color: '#9AA1AD', fontSize: 26}}>Java SOAP library</div>
          <div style={{position: 'absolute', top: 340, left: 0, right: 0, textAlign: 'center', fontFamily: MONO, color: '#9AA1AD', fontSize: 26}}>— end of life —</div>
          {/* crack */}
          <svg style={{position: 'absolute', inset: 0}} viewBox="0 0 520 600">
            <Draw d="M 300 0 L 280 90 L 320 150 L 270 230 L 310 300 L 250 420 L 290 520 L 260 600" p={crack} stroke="#0B0C0F" w={7} len={800} />
            <Draw d="M 300 0 L 280 90 L 320 150 L 270 230 L 310 300 L 250 420 L 290 520 L 260 600" p={crack} stroke={C.red} w={2.5} len={800} opacity={0.9} />
          </svg>
          {/* exploit lines leaking out */}
          {frame > hackers &&
            ['POST /axis/services', 'SOAP fault → class load', 'exec: /bin/bash', 'curl http://c2.example', 'whoami → confluence'].map((s, i) => {
              const st = hackers + 4 + i * 6;
              const p = prog(frame, st, 40);
              if (frame < st) return null;
              return (
                <div key={i} style={{position: 'absolute', left: i % 2 ? 330 : -150, top: 420 - p * 360 + i * 22, fontFamily: MONO, fontSize: 22, color: C.redBright, opacity: (1 - p) * 0.95, whiteSpace: 'nowrap', filter: `blur(${p * 2}px)`}}>
                  {s}
                </div>
              );
            })}
          <Stamp frame={frame} at={died + 4} text="EOL" color="#C9CED8" size={58} rot={-12} style={{left: 60, top: 430}} />
          <Stamp frame={frame} at={now} text="EXPLOITED" color={C.redBright} size={64} rot={8} style={{left: 90, top: 470}} />
        </div>
      </div>
      {frame >= now && (
        <div style={{position: 'absolute', top: 70, right: 70, display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontWeight: 700, fontSize: 28, color: C.redBright, opacity: prog(frame, now, 6)}}>
          <span style={{width: 18, height: 18, borderRadius: 9, background: C.redBright, opacity: 0.4 + 0.6 * pulse(frame, 14)}} />
          LIVE ATTACKS
        </div>
      )}
    </div>
  );
};

/* ================= ATTACK CHAIN ================= */
export const Chain: React.FC<SP> = ({frame, t, start}) => {
  const c1 = cue('chain', 'Confluence');
  const c4 = cue('chain', 'Four');
  const cdw = cue('chain', 'data');
  const c12 = cue('chain', 'Twelve');
  const c365 = cue('chain', '365');
  // node layout on a tall canvas, camera follows
  const nodes = [
    {x: 330, y: 118, title: 'Confluence server', sub: 'Data Center · Axis 1.x inside', icon: <ServerIcon c={t.text} led={C.redBright} />, at: c1, tag: 'T+0h'},
    {x: 740, y: 318, title: 'Cloud data warehouse', sub: 'queried with a stolen service account', icon: <DbIcon c={t.text} />, at: cdw, tag: 'T+4h'},
    {x: 340, y: 538, title: 'Microsoft 365', sub: 'signed in as an integration account', icon: <OfficeIcon />, at: c365, tag: 'T+12h'},
  ];
  const camY = 0;
  const hours = frame < c4 ? '00' : frame < c12 ? '04' : '12';
  const hourStart = frame < c4 ? -999 : frame < c12 ? c4 : c12;
  const seg = (a: {x: number; y: number}, b: {x: number; y: number}) => `M ${a.x} ${a.y + 60} C ${a.x} ${(a.y + b.y) / 2 + 60}, ${b.x} ${(a.y + b.y) / 2}, ${b.x} ${b.y - 60}`;
  const s1 = prog(frame, c4, 26), s2 = prog(frame, c12, 26);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1200, transform: `translateY(${-camY}px)`}}>
        <svg width={1080} height={1200} style={{position: 'absolute', left: 0, top: 0}}>
          <path d={seg(nodes[0], nodes[1])} stroke={t.line} strokeWidth={4} fill="none" strokeDasharray="10 12" />
          <path d={seg(nodes[1], nodes[2])} stroke={t.line} strokeWidth={4} fill="none" strokeDasharray="10 12" />
          <Draw d={seg(nodes[0], nodes[1])} p={s1} stroke={C.redBright} w={5} len={900} />
          <Draw d={seg(nodes[1], nodes[2])} p={s2} stroke={C.redBright} w={5} len={900} />
        </svg>
        {nodes.map((n, i) => {
          const lit = frame >= n.at;
          const e = prog(frame, i === 0 ? start + 2 : i === 1 ? c4 + 6 : c12 + 6, 10);
          return (
            <div key={i} style={{position: 'absolute', left: n.x - 290, top: n.y - 90, width: 580, opacity: e, filter: `blur(${(1 - e) * 10}px)`, transform: `scale(${lerp(0.9, 1, e)})`}}>
              <Card t={t} pad={22} style={{display: 'flex', gap: 22, alignItems: 'center', border: `2px solid ${lit ? C.redBright : t.line}`, boxShadow: lit ? `0 0 ${40 * pulse(frame, 20)}px rgba(229,72,77,.45)` : undefined}}>
                <div style={{flex: '0 0 auto'}}>{n.icon}</div>
                <div style={{minWidth: 0}}>
                  <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: t.text}}>{n.title}</div>
                  <div style={{fontFamily: MONO, fontSize: 23, color: t.mute, marginTop: 6}}>{n.sub}</div>
                </div>
              </Card>
              <div style={{position: 'absolute', top: -20, right: -10}}>
                <Badge color={C.redBright} solid={lit}>
                  {lit && <Skull s={22} c="#fff" />} {n.tag}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
      {/* attack clock */}
      <div style={{position: 'absolute', right: 40, top: 480, textAlign: 'right', padding: '14px 22px', borderRadius: 18, background: t.card, border: `1.5px solid ${t.line}`}}>
        <div style={{fontFamily: MONO, fontSize: 20, color: t.mute, letterSpacing: 2}}>TIME SINCE FIRST EXPLOIT</div>
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 84, color: frame >= c12 ? C.redBright : t.text}}>
          T+<Odometer key={hours} text={hours} start={hourStart} frame={frame} size={84} color={frame >= c12 ? C.redBright : t.text} dur={22} />h
        </div>
      </div>
    </div>
  );
};

/* ================= PROMISE ================= */
export const Promise: React.FC<SP> = ({frame, t, start}) => {
  const two = cue('promise', 'Two');
  const exp = cue('promise', 'exposed');
  const bug = (i: number, name: string, cve: string, sub: string) => {
    const e = spr(frame, two + 2 + i * 6, 30, 13, 0.6);
    return (
      <div style={{transform: `translateY(${(1 - e) * 60}px) scale(${lerp(0.9, 1, e)})`, opacity: clamp(e * 1.4), filter: `blur(${(1 - clamp(e)) * 8}px)`}}>
        <Card t={t} style={{width: 860, display: 'flex', alignItems: 'center', gap: 26}}>
          <div style={{width: 92, height: 92, borderRadius: 22, background: `${C.red}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 40, color: C.red}}>
            #{i + 1}
          </div>
          <div style={{flex: 1}}>
            <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: t.text}}>{name}</div>
            <div style={{fontFamily: MONO, fontSize: 22, color: t.mute, marginTop: 4}}>{cve} · {sub}</div>
          </div>
          <div style={{textAlign: 'center'}}>
            <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 46, color: C.red}}>9.8</div>
            <div style={{fontFamily: MONO, fontSize: 16, color: t.mute, letterSpacing: 2}}>CRITICAL</div>
          </div>
        </Card>
      </div>
    );
  };
  const scan = prog(frame, exp, 22, easeInOut);
  return (
    <div style={{...center, flexDirection: 'column', gap: 34}}>
      <div style={{position: 'relative', display: 'flex', flexDirection: 'column', gap: 30}}>
        {bug(0, 'Apache Axis 1.x', 'CVE-2026-90436', 'unauth RCE')}
        {bug(1, 'Apache Roller', 'CVE-2026-129448', 'unauth RCE')}
        {frame >= exp && <div style={{position: 'absolute', left: -20, right: -20, top: lerp(-20, 400, scan), height: 6, background: C.blue, boxShadow: `0 0 30px ${C.blue}`, opacity: 1 - prog(frame, exp + 22, 6)}} />}
      </div>
      <div style={{opacity: prog(frame, exp + 4, 8), transform: `translateY(${(1 - prog(frame, exp + 4, 8)) * 20}px)`}}>
        <Select p={prog(frame, exp + 8, 6)}>
          <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 44, color: t.text, padding: '0 10px'}}>Are you exposed? ↓</span>
        </Select>
      </div>
    </div>
  );
};

/* ================= AXIS ================= */
export const Axis: React.FC<SP> = ({frame, t, end}) => {
  const a = cue('axis', 'Axis');
  const eol = cue('axis', 'end-of-life');
  const hid = cue('axis', 'hiding');
  const conf = cue('axis', 'Confluence');
  const bug = cue('axis', 'bug');
  const no = cue('axis', 'No');
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Panel frame={frame} a={a - 6} b={hid}>
        <div style={center}>
          <Card t={t} style={{width: 760, textAlign: 'center', padding: 46, position: 'relative'}}>
            <div style={{display: 'flex', justifyContent: 'center'}}>
              <JarIcon s={150} c={t.text} />
            </div>
            <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 56, color: t.text, marginTop: 14}}>axis-1.4.jar</div>
            <div style={{fontFamily: MONO, fontSize: 26, color: t.mute, marginTop: 10}}>Apache Axis 1.x · Java SOAP engine</div>
            <div style={{display: 'flex', gap: 16, justifyContent: 'center', marginTop: 28, opacity: prog(frame, eol, 8)}}>
              <Badge color={t.mute}>END OF LIFE</Badge>
              <Badge color={C.amber}>NO MORE RELEASES</Badge>
            </div>
            <Stamp frame={frame} at={eol + 6} text="EOL" color={C.redBright} size={70} rot={-14} style={{right: -30, top: -30}} />
          </Card>
        </div>
      </Panel>
      <Panel frame={frame} a={hid} b={bug}>
        <div style={center}>
          <Window t={t} title={frame >= conf ? 'confluence — Atlassian team wiki' : 'some-product/'} style={{width: 860}}>
            {[
              ['confluence/', 0, false],
              ['└ WEB-INF/lib/', 1, false],
              ['├ spring-core-5.3.jar', 2, false],
              ['├ jackson-databind.jar', 2, false],
              ['├ axis-1.4.jar', 2, true],
              ['├ velocity-1.6.jar', 2, false],
              ['└ … 400 more', 2, false],
            ].map(([txt, ind, hot], i) => {
              const e = prog(frame, hid + 2 + i * 3, 8);
              const sel = hot ? prog(frame, hid + 26, 6) : 0;
              return (
                <div key={i} style={{fontFamily: MONO, fontSize: 32, lineHeight: '58px', paddingLeft: (ind as number) * 44, color: hot ? C.redBright : t.text, opacity: e * (hot ? 1 : 0.85), transform: `translateX(${(1 - e) * 20}px)`}}>
                  {hot ? (
                    <Select p={sel} color={C.redBright}>
                      <span style={{fontWeight: 700}}>{txt as string}</span>
                    </Select>
                  ) : (
                    (txt as string)
                  )}
                  {hot && sel > 0.9 && <span style={{fontFamily: SANS, fontSize: 24, color: C.redBright, marginLeft: 30, fontWeight: 700}}>← end-of-life, still shipped</span>}
                </div>
              );
            })}
          </Window>
        </div>
      </Panel>
      <Panel frame={frame} a={bug} b={no}>
        <div style={{...center, flexDirection: 'column'}}>
          <Card t={t} style={{width: 760, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 50}}>
            <Gauge frame={frame} at={bug + 4} value={9.8} t={t} />
            <div style={{fontFamily: MONO, fontSize: 26, color: t.mute, marginTop: 10}}>CVE-2026-90436 · CVSS out of 10</div>
            <div style={{marginTop: 18, opacity: prog(frame, bug + 26, 8)}}>
              <Badge color={C.redBright} solid>CRITICAL</Badge>
            </div>
          </Card>
        </div>
      </Panel>
      <Panel frame={frame} a={no} b={end + 2}>
        <div style={center}>
          <Window t={C.dark} title="attacker@internet" style={{width: 880}} bar="#15171C">
            <div style={{fontFamily: MONO, fontSize: 27, lineHeight: '48px', color: '#E6E8EC'}}>
              <div>
                <span style={{color: C.greenBright}}>$</span> <Typed frame={frame} at={no + 2} text="curl -X POST /…/soap-axis1/…" caret={false} />
              </div>
              <div style={{opacity: prog(frame, no + 16, 4)}}>
                <span style={{color: '#8B919C'}}>Authorization:</span> <span style={{color: C.redBright, fontWeight: 700}}>none</span>
              </div>
              <div style={{opacity: prog(frame, no + 24, 4)}}>
                <span style={{color: C.greenBright}}>$</span> <Typed frame={frame} at={no + 24} text="whoami" caret={false} />
              </div>
              <div style={{opacity: prog(frame, no + 34, 4), color: C.redBright, fontWeight: 700}}>confluence   ← code running on your server</div>
            </div>
          </Window>
          <Stamp frame={frame} at={no + 4} text="NO PASSWORD" color={C.redBright} size={56} rot={-6} style={{left: 120, top: 70}} />
        </div>
      </Panel>
    </div>
  );
};

/* ================= CATCH ================= */
export const Catch: React.FC<SP> = ({frame, t, end}) => {
  const k = cue('catch', 'catch');
  const nev = cue('catch', 'never');
  const ven = cue('catch', 'vendor');
  const ver = cue('catch', '9.2.28');
  const rem = cue('catch', 'Remote');
  const def = cue('catch', 'default');
  const still = cue('catch', 'still');
  const uncheck = rem + 16;
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Panel frame={frame} a={k - 4} b={ven}>
        <div style={center}>
          <Window t={t} title="Apache Axis 1.x — releases" style={{width: 840, position: 'relative'}}>
            {[
              ['1.4', 'final 1.x release', t.text],
              ['1.x fix', 'none planned', C.redBright],
            ].map(([v, s, c], i) => (
              <div key={i} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 6px', borderBottom: i === 0 ? `1.5px solid ${t.line}` : 'none', opacity: prog(frame, k + i * 6, 8)}}>
                <Mono s={36} w={700} c={c as string}>{v}</Mono>
                <Mono s={26} c={i ? C.redBright : t.mute}>{s}</Mono>
              </div>
            ))}
            <div style={{fontFamily: SANS, fontSize: 26, color: t.mute, marginTop: 18, opacity: prog(frame, k + 14, 8)}}>Apache's advice: move off Axis 1.x</div>
          </Window>
          <Stamp frame={frame} at={nev} text="NO FIX COMING" color={C.redBright} size={60} rot={-7} style={{top: 540}} />
        </div>
      </Panel>
      <Panel frame={frame} a={ven} b={rem}>
        <div style={{...center, flexDirection: 'column', gap: 30}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 26, opacity: prog(frame, ven, 8)}}>
            <Card t={t} pad={22} style={{fontFamily: SANS, fontWeight: 800, fontSize: 32, color: t.mute, textDecoration: 'line-through'}}>Apache Axis 1.x</Card>
            <svg width={90} height={40}>
              <Draw d="M 5 20 L 80 20 M 64 6 L 82 20 L 64 34" p={prog(frame, ven + 4, 10)} stroke={C.greenBright} w={5} len={200} />
            </svg>
            <Card t={t} pad={22} style={{fontFamily: SANS, fontWeight: 800, fontSize: 32, color: t.text, border: `2px solid ${C.greenBright}`}}>Your vendor's patch</Card>
          </div>
          <div style={{opacity: prog(frame, ver - 4, 8), transform: `scale(${lerp(0.9, 1, spr(frame, ver - 4))})`}}>
            <Card t={t} style={{width: 760, textAlign: 'center', padding: 40}}>
              <div style={{fontFamily: MONO, fontSize: 24, color: t.mute, letterSpacing: 2}}>CONFLUENCE DATA CENTER — FIXED IN</div>
              <div style={{marginTop: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20}}>
                <Odometer text="9.2.28" start={ver} frame={frame} size={96} color={C.greenBright} />
                <span style={{fontSize: 70, color: C.greenBright, opacity: prog(frame, ver + 24, 6)}}>✓</span>
              </div>
              <div style={{fontFamily: MONO, fontSize: 22, color: t.mute, marginTop: 10, opacity: prog(frame, ver + 20, 8)}}>10.x removed the Remote API · Cloud not affected</div>
            </Card>
          </div>
        </div>
      </Panel>
      <Panel frame={frame} a={rem} b={end + 2}>
        <div style={{...center, flexDirection: 'column', gap: 28}}>
          <Window t={t} title="Confluence admin › General configuration" style={{width: 880, position: 'relative'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0'}}>
              <div>
                <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, color: t.text}}>Remote API (XML-RPC &amp; SOAP)</div>
                <div style={{fontFamily: MONO, fontSize: 21, color: t.mute, marginTop: 6}}>the Axis 1.x attack surface</div>
              </div>
              <Toggle on={1 - prog(frame, uncheck, 5)} color={C.redBright} />
            </div>
            <div style={{fontFamily: MONO, fontSize: 22, color: C.greenBright, marginTop: 10, opacity: prog(frame, uncheck + 8, 6)}}>✓ Saved — takes effect immediately</div>
            <Cursor x={lerp(380, 760, prog(frame, rem + 2, 12, easeInOut))} y={lerp(260, 80, prog(frame, rem + 2, 12, easeInOut))} click={frame >= uncheck ? prog(frame, uncheck, 10) : 0} />
          </Window>
          <div style={{display: 'flex', gap: 22}}>
            <div style={{opacity: prog(frame, def, 8), transform: `translateY(${(1 - prog(frame, def, 8)) * 20}px)`}}>
              <Card t={t} pad={22} style={{width: 410}}>
                <Mono s={20} c={t.mute}>NEW INSTALL</Mono>
                <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 32, color: C.greenBright, marginTop: 6}}>OFF by default ✓</div>
              </Card>
            </div>
            <div style={{opacity: prog(frame, still - 6, 8), transform: `translateY(${(1 - prog(frame, still - 6, 8)) * 20}px)`}}>
              <Card t={t} pad={22} style={{width: 410, border: `2px solid ${C.amber}`, boxShadow: `0 0 ${36 * pulse(frame, 16)}px rgba(210,153,34,.4)`}}>
                <Mono s={20} c={t.mute}>OLD, UPGRADED SERVER</Mono>
                <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 32, color: C.amber, marginTop: 6}}>might still be ON ⚠</div>
              </Card>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
};

/* ================= TRAP (rehook) ================= */
export const Trap: React.FC<SP> = ({frame, t, start}) => {
  const tr = cue('trap', 'trap');
  const snap = prog(frame, tr + 2, 4);
  const e = spr(frame, start + 2, 30, 12, 0.6);
  return (
    <div style={{...center, flexDirection: 'column', gap: 20}}>
      <div style={{transform: `scale(${lerp(0.85, 1, e)}) rotate(${snap > 0 && snap < 1 ? Math.sin(frame) * 2 : 0}deg)`, opacity: clamp(e * 1.4)}}>
        <Card t={t} style={{width: 820, textAlign: 'center', padding: 44}}>
          <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 30, color: C.red, letterSpacing: 4}}>BUG #2</div>
          <svg width={520} height={300} viewBox="0 0 520 300" style={{marginTop: 10}}>
            <rect x={40} y={200} width={440} height={60} rx={10} fill="#C08B57" stroke="#8A5E33" strokeWidth={5} />
            <rect x={70} y={190} width={380} height={14} rx={4} fill="#9CA3AF" />
            <path d="M 300 192 L 360 150 L 380 192 Z" fill="#FACC15" stroke="#CA8A04" strokeWidth={4} />
            <circle cx={330} cy={176} r={5} fill="#CA8A04" />
            <circle cx={355} cy={182} r={4} fill="#CA8A04" />
            <g transform={`rotate(${lerp(-150, 0, snap)} 110 196)`}>
              <rect x={110} y={190} width={330} height={12} rx={6} fill="#6B7280" />
            </g>
            <circle cx={110} cy={196} r={14} fill="#4B5563" />
          </svg>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 52, color: t.text, marginTop: 6}}>Apache Roller</div>
        </Card>
      </div>
      {snap >= 1 && <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: C.red, opacity: prog(frame, tr + 6, 6)}}>the obvious fix doesn't work</div>}
    </div>
  );
};

/* ================= ROLLER ================= */
export const Roller: React.FC<SP> = ({frame, t, end, start}) => {
  const r = cue('roller', 'Roller');
  const blog = cue('roller', 'blogging');
  const nine = cue('roller', '9.8');
  const v = cue('roller', '6.1.6');
  const ex = cue('roller', 'exploited');
  const versions = ['4.0.0', '5.x', '6.1.4', '6.1.5', '6.1.6'];
  const fill = prog(frame, v - 10, 30, easeInOut);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Panel frame={frame} a={start} b={v - 4}>
        <div style={center}>
          <div style={{position: 'relative'}}>
            <Window t={t} title="blog.example.com" style={{width: 860}}>
              <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: t.text}}>Engineering Blog</div>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{display: 'flex', gap: 20, marginTop: 22, opacity: prog(frame, start + 4 + i * 4, 8)}}>
                  <div style={{width: 120, height: 80, borderRadius: 12, background: ['#FDE68A', '#BFDBFE', '#C7F9CC'][i]}} />
                  <div style={{flex: 1}}>
                    <div style={{height: 20, width: ['80%', '65%', '72%'][i], background: t.text, opacity: 0.8, borderRadius: 6}} />
                    <div style={{height: 14, width: '90%', background: t.mute, opacity: 0.35, borderRadius: 6, marginTop: 12}} />
                    <div style={{height: 14, width: '60%', background: t.mute, opacity: 0.35, borderRadius: 6, marginTop: 8}} />
                  </div>
                </div>
              ))}
              <div style={{fontFamily: MONO, fontSize: 20, color: t.mute, marginTop: 22, opacity: prog(frame, r, 8)}}>
                Powered by <Select p={prog(frame, r + 2, 6)}><b style={{color: t.text}}>Apache Roller</b></Select>
              </div>
            </Window>
            <div style={{position: 'absolute', top: -26, right: -16, opacity: prog(frame, blog, 8)}}>
              <Badge color={C.blue} solid>open-source blogging</Badge>
            </div>
            {frame >= nine && (
              <div style={{position: 'absolute', bottom: -40, right: -10, transform: `scale(${lerp(1.6, 1, spr(frame, nine))})`, opacity: clamp(spr(frame, nine) * 1.5)}}>
                <Card t={t} pad={20} style={{border: `3px solid ${C.red}`, textAlign: 'center'}}>
                  <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 64, color: C.red}}>9.8</div>
                  <div style={{fontFamily: MONO, fontSize: 18, color: t.mute, letterSpacing: 2}}>CVSS · CRITICAL</div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </Panel>
      <Panel frame={frame} a={v - 4} b={end + 2}>
        <div style={{...center, flexDirection: 'column', gap: 30}}>
          <Card t={t} style={{width: 900, padding: 40}}>
            <div style={{fontFamily: MONO, fontSize: 24, color: t.mute, letterSpacing: 2}}>CVE-2026-129448 · AFFECTED VERSIONS</div>
            <div style={{position: 'relative', height: 150, marginTop: 30}}>
              <div style={{position: 'absolute', left: 0, right: 0, top: 40, height: 16, borderRadius: 8, background: t.line}} />
              <div style={{position: 'absolute', left: 0, width: `${fill * 78}%`, top: 40, height: 16, borderRadius: 8, background: C.red}} />
              <div style={{position: 'absolute', left: '80%', width: `${prog(frame, v + 18, 10) * 20}%`, top: 40, height: 16, borderRadius: 8, background: C.green}} />
              {versions.map((vv, i) => {
                const x = i === 4 ? 92 : (i / 3) * 74;
                const fixed = i === 4;
                return (
                  <div key={vv} style={{position: 'absolute', left: `${x}%`, top: 20, transform: 'translateX(-50%)', textAlign: 'center', opacity: prog(frame, v - 4 + i * 4, 6)}}>
                    <div style={{width: 30, height: 30, margin: '13px auto 0', borderRadius: 15, background: fixed ? C.green : C.red, border: `4px solid ${t.card}`, boxShadow: `0 0 0 2px ${fixed ? C.green : C.red}`}} />
                    <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 26, color: fixed ? C.green : t.text, marginTop: 14}}>{vv}</div>
                  </div>
                );
              })}
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: SANS, fontWeight: 800, fontSize: 30}}>
              <span style={{color: C.red}}>everything before → vulnerable</span>
              <span style={{color: C.green, opacity: prog(frame, v + 18, 8)}}>fixed ✓</span>
            </div>
          </Card>
          <div style={{opacity: prog(frame, ex - 2, 8), transform: `scale(${lerp(1.2, 1, prog(frame, ex - 2, 10))})`}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 16, padding: '18px 30px', borderRadius: 18, background: C.red, color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 36, boxShadow: `0 0 ${50 * pulse(frame, 16)}px rgba(229,72,77,.55)`}}>
              <span style={{width: 18, height: 18, borderRadius: 9, background: '#fff', opacity: 0.4 + 0.6 * pulse(frame, 10)}} />
              Apache: exploited in the wild
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
};

/* ================= PAYOFF ================= */
export const Payoff: React.FC<SP> = ({frame, t, end, start}) => {
  const xr = cue('payoff', 'XML-RPC');
  const adm = cue('payoff', 'admin');
  const not = cue('payoff', 'NOT');
  const up = cue('payoff', 'upgrade');
  const v = cue('payoff', '6.1.6');
  const flip = xr + 8;
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Panel frame={frame} a={start} b={up - 2}>
        <div style={center}>
          <div style={{position: 'relative'}}>
            <Window t={t} title={frame >= adm ? 'Roller › Server Admin › Web services' : 'Roller › settings'} style={{width: 880}}>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0'}}>
                <div>
                  <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 36, color: t.text}}>
                    <Select p={prog(frame, xr, 6)}>Enable XML-RPC</Select>
                  </div>
                  <div style={{fontFamily: MONO, fontSize: 21, color: t.mute, marginTop: 10}}>remote posting from blog clients</div>
                </div>
                <Toggle on={1 - prog(frame, flip, 5)} />
              </div>
              <Cursor x={lerp(300, 760, prog(frame, start + 6, 14, easeInOut))} y={lerp(220, 60, prog(frame, start + 6, 14, easeInOut))} click={frame >= flip ? prog(frame, flip, 10) : 0} />
              <div style={{marginTop: 20, padding: 18, borderRadius: 14, background: t.card2, fontFamily: MONO, fontSize: 23, color: t.text, opacity: prog(frame, not - 10, 6)}}>
                <span style={{color: t.mute}}>incoming:</span> POST /roller-services/xmlrpc
                <div style={{color: C.red, fontWeight: 700, marginTop: 6, opacity: prog(frame, not - 2, 4)}}>→ still deserialized before auth ✗</div>
              </div>
            </Window>
            <Stamp frame={frame} at={not} text="STILL VULNERABLE" color={C.red} size={60} rot={-6} style={{left: 130, top: 430}} />
          </div>
        </div>
      </Panel>
      <Panel frame={frame} a={up - 2} b={end + 2}>
        <div style={center}>
          <Card t={t} style={{width: 860, padding: 46, textAlign: 'center'}}>
            <div style={{fontFamily: MONO, fontSize: 24, color: t.mute, letterSpacing: 2}}>THE ONLY REAL FIX</div>
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 26, marginTop: 20, fontFamily: MONO, fontWeight: 700, fontSize: 60}}>
              <span style={{color: C.red, textDecoration: prog(frame, v, 4) > 0.5 ? 'line-through' : 'none'}}>6.1.5</span>
              <span style={{color: t.mute}}>→</span>
              <span style={{color: C.green}}>6.1.6+</span>
            </div>
            <div style={{height: 22, borderRadius: 11, background: t.line, marginTop: 34, overflow: 'hidden'}}>
              <div style={{height: '100%', width: `${prog(frame, up + 2, 34, easeInOut) * 100}%`, background: `linear-gradient(90deg, ${C.blue}, ${C.green})`}} />
            </div>
            <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: C.green, marginTop: 24, opacity: prog(frame, v + 10, 8)}}>Upgraded ✓ patched</div>
          </Card>
        </div>
      </Panel>
    </div>
  );
};

/* ================= CLOSE ================= */
export const Close: React.FC<SP> = ({frame, t, end, start}) => {
  const forgot = cue('close', 'forgot');
  const search = cue('close', 'Search');
  const ax = cue('close', 'Axis');
  const ro = cue('close', 'Roller');
  const today = cue('close', 'Today');
  const zoom = prog(frame, forgot - 4, 20, easeInOut);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Panel frame={frame} a={start} b={search - 2}>
        <div style={{...center}}>
          <div style={{transform: `scale(${lerp(1, 1.18, zoom)}) translateY(${lerp(0, -60, zoom)}px)`, position: 'relative'}}>
            <div style={{width: 640, padding: 26, borderRadius: 22, background: '#1A1C22', border: '2px solid #2B2F38', boxShadow: '0 40px 90px rgba(0,0,0,.6)'}}>
              {Array.from({length: 6}).map((_, i) => {
                const old = i === 4;
                return (
                  <div key={i} style={{position: 'relative', height: 70, marginBottom: i < 5 ? 14 : 0, borderRadius: 10, background: old ? '#3A3733' : '#24272F', border: `2px solid ${old ? '#4D4740' : '#30343E'}`, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16, opacity: old ? 1 : lerp(1, 0.45, zoom)}}>
                    <span style={{width: 14, height: 14, borderRadius: 7, background: old ? (pulse(frame, 10) > 0.5 ? C.redBright : '#5a1f22') : C.greenBright}} />
                    <span style={{fontFamily: MONO, fontSize: 22, color: old ? '#C9B8A0' : '#8B919C'}}>{old ? 'legacy-app-02 · uptime: years' : `web-0${i + 1}`}</span>
                    {old && (
                      <svg width={130} height={90} style={{position: 'absolute', right: -8, top: -10}} viewBox="0 0 130 90">
                        <path d="M130 0 L60 90 M130 0 L90 90 M130 0 L20 60 M130 0 L10 20 M100 0 L130 30" stroke="rgba(255,255,255,.35)" strokeWidth={1.5} />
                        <path d="M118 12 Q110 22 104 14 M108 26 Q96 40 86 28 M98 40 Q80 58 66 42" stroke="rgba(255,255,255,.35)" strokeWidth={1.5} fill="none" />
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
            {frame >= forgot && (
              <div style={{position: 'absolute', left: 14, right: 14, top: 26 + 4 * 84 - 10, height: 90}}>
                <Select p={prog(frame, forgot + 2, 6)} color={C.redBright} style={{width: '100%', height: '100%'}}>
                  <span />
                </Select>
                <div style={{position: 'absolute', right: 0, top: -54, fontFamily: SANS, fontWeight: 800, fontSize: 30, color: C.redBright, opacity: prog(frame, forgot + 8, 6)}}>forgotten, still running</div>
              </div>
            )}
          </div>
        </div>
      </Panel>
      <Panel frame={frame} a={search - 2} b={end + 2}>
        <div style={center}>
          <Window t={C.dark} title="you@your-network" style={{width: 900}} bar="#15171C">
            <div style={{fontFamily: MONO, fontSize: 27, lineHeight: '50px', color: '#E6E8EC'}}>
              <div>
                <span style={{color: C.greenBright}}>$</span> <Typed frame={frame} at={search + 2} text={'find / -name "axis*.jar"'} caret={frame < ax + 12} />
              </div>
              <div style={{color: C.redBright, opacity: prog(frame, ax + 6, 4)}}>/opt/legacy-app/lib/axis-1.4.jar ⚠</div>
              <div>
                {frame >= ro - 4 && <span style={{color: C.greenBright}}>$ </span>}
                <Typed frame={frame} at={ro - 4} text={'find / -iname "*roller*"'} caret={frame >= ro - 4} />
              </div>
              <div style={{color: C.redBright, opacity: prog(frame, ro + 12, 4)}}>/srv/blog/roller-6.1.4.war ⚠</div>
            </div>
          </Window>
          <Stamp frame={frame} at={today} text="TODAY" color={C.amber} size={74} rot={-8} style={{right: 80, bottom: 60}} />
        </div>
      </Panel>
    </div>
  );
};

/* ================= CTA ================= */
export const Cta: React.FC<SP> = ({frame, t, start, end}) => {
  const fol = cue('cta', 'Follow');
  const send = cue('cta', 'send');
  const old = cue('cta', 'old');
  const tapF = fol + 10;
  const sheet = prog(frame, send - 2, 10, easeInOut);
  const tapS = send + 22;
  const tapSend = old + 2;
  const e = spr(frame, start, 30, 13, 0.7);
  return (
    <div style={{...center}}>
      <div style={{transform: `translateY(${(1 - e) * 120}px) scale(1.12)`, opacity: clamp(e * 1.5)}}>
        <div style={{position: 'relative', width: 400, height: 680, borderRadius: 54, background: '#0B0C0F', padding: 14, boxShadow: '0 40px 90px rgba(15,23,42,.35)'}}>
          <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: 42, overflow: 'hidden', background: '#111318'}}>
            {/* the reel itself */}
            <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#1b1e26,#0e0f12)'}} />
            <div style={{position: 'absolute', top: 90, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 30, color: '#fff'}}>Dead software.<br />Live attacks.</div>
            <div style={{position: 'absolute', top: 190, left: 110, width: 180, height: 200, borderRadius: '90px 90px 14px 14px', background: 'linear-gradient(160deg,#5B616E,#23262D)'}} />
            <div style={{position: 'absolute', left: 20, right: 20, bottom: 70, display: 'flex', alignItems: 'center', gap: 12}}>
              <div style={{width: 46, height: 46, borderRadius: 23, background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <svg width={26} height={26} viewBox="0 0 40 40"><path d="M20 4 L34 9.5 V19 C34 28 28 33.5 20 36.5 C12 33.5 6 28 6 19 V9.5 Z" fill="none" stroke="#fff" strokeWidth={3.5} /></svg>
              </div>
              <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 22, color: '#fff'}}>scripthook</span>
              <span
                style={{
                  marginLeft: 8, padding: '6px 16px', borderRadius: 10, fontFamily: SANS, fontWeight: 800, fontSize: 20,
                  border: '2px solid #fff', color: '#fff', background: frame >= tapF ? 'rgba(255,255,255,.15)' : 'transparent',
                  transform: `scale(${frame >= tapF ? lerp(0.85, 1, prog(frame, tapF, 8)) : 1})`,
                }}
              >
                {frame >= tapF ? 'Following' : 'Follow'}
              </span>
            </div>
            {/* share sheet */}
            <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 380, transform: `translateY(${(1 - sheet) * 400}px)`, background: '#fff', borderRadius: '30px 30px 0 0', padding: 22}}>
              <div style={{width: 60, height: 6, borderRadius: 3, background: '#D1D5DB', margin: '0 auto 18px'}} />
              <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 22, color: '#111'}}>Send to</div>
              <div style={{display: 'flex', justifyContent: 'space-around', marginTop: 22}}>
                {[
                  ['sysadmin', '#64748B'],
                  ['devops', '#0EA5E9'],
                  ['sec-team', '#A855F7'],
                ].map(([name, col], i) => {
                  const picked = i === 0 && frame >= tapS;
                  return (
                    <div key={name} style={{textAlign: 'center'}}>
                      <div style={{position: 'relative', width: 78, height: 78, borderRadius: 39, background: col, margin: '0 auto', boxShadow: picked ? `0 0 0 4px #fff, 0 0 0 7px ${C.blue}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34}}>
                        <span style={{fontFamily: SANS, fontWeight: 800, color: '#fff', fontSize: 30}}>{(name as string)[0].toUpperCase()}</span>
                        {picked && <span style={{position: 'absolute', right: -4, bottom: -4, width: 28, height: 28, borderRadius: 14, background: C.blue, color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>✓</span>}
                      </div>
                      <div style={{fontFamily: SANS, fontSize: 18, fontWeight: 700, color: '#111', marginTop: 8}}>{name}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{marginTop: 34, height: 60, borderRadius: 14, background: frame >= tapSend + 6 ? C.green : C.blue, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 24}}>
                {frame >= tapSend + 6 ? 'Sent ✓' : 'Send'}
              </div>
            </div>
            {/* finger taps */}
            {[tapF, tapS, tapSend].map((tp, i) => {
              if (frame < tp - 8 || frame > tp + 12) return null;
              const pos = [[300, 600], [80, 450], [190, 610]][i];
              const c = prog(frame, tp, 10);
              return <div key={i} style={{position: 'absolute', left: pos[0] - 30, top: pos[1] - 30, width: 60, height: 60, borderRadius: 30, background: 'rgba(59,130,246,.35)', border: '3px solid rgba(59,130,246,.9)', transform: `scale(${lerp(0.6, 1.4, c)})`, opacity: 1 - c * 0.8}} />;
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
