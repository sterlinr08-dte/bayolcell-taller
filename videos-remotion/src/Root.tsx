import React from 'react';
import {Composition} from 'remotion';
import {Promo} from './Promo';
import {Cristal} from './Cristal';
export const Root: React.FC = () => (
  <>
    <Composition id="Vertical" component={Promo} durationInFrames={300} fps={30} width={1080} height={1920} />
    <Composition id="Horizontal" component={Promo} durationInFrames={300} fps={30} width={1920} height={1080} />
    <Composition id="Cristal" component={Cristal} durationInFrames={900} fps={30} width={1080} height={1920} />
  </>
);
