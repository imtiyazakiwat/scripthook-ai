import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Character} from './Character';
const G = ['idle','present_l','present_r','point_up','point_card','count1','count2','count4','hands_head','shrug','stop','wag','think','thumbs_up','rub_hands','warn','switch','magnify','arms_crossed','point_out','wave','phone'];
const E = ['neutral','serious','alarmed','shocked','confident','mischief','annoyed','worried','happy'];
export const CharSheet: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: frame % 2 ? '#0E0F12' : '#F5F5F4', flexDirection: 'row', flexWrap: 'wrap'}}>
      {G.map((g, i) => (
        <div key={g} style={{width: 360, height: 400, position: 'relative', overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 0, top: 0, transform: 'scale(0.6)', transformOrigin: '0 0'}}>
            <Character frame={200} darkBg={frame % 2 === 1} force={{gesture: g, emotion: E[i % E.length]}} />
          </div>
          <div style={{position: 'absolute', top: 6, left: 8, font: '20px monospace', color: '#888'}}>{g}/{E[i % E.length]}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
