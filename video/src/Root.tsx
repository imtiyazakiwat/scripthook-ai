import React from 'react';
import {Composition} from 'remotion';
import {Reel} from './Reel';
import {CharSheet} from './CharSheet';
import {FPS, TOTAL_FRAMES} from './lib';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';

export const Root: React.FC = () => (
  <>
  <Composition id="CharSheet" component={CharSheet} durationInFrames={2} fps={FPS} width={2160} height={1600} />
  <Composition id="Reel" component={Reel} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1080} height={1920} />
  </>
);
