import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Sequence, Easing, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';

const BIG = 'Archivo Black', MONO = 'JetBrains Mono', SANS = 'Inter';
loadFont({family: BIG, url: staticFile('ArchivoBlack.woff2')});
loadFont({family: MONO, url: staticFile('JetBrainsMono.woff2'), weight: '500'});
loadFont({family: SANS, url: staticFile('Inter.woff2'), weight: '700'});
const NARANJA = '#FF3B30';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Fondo: cuadrícula técnica que se desliza + viñeta
const Grid: React.FC = () => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const off = (f * 0.6) % 80;
  return (
    <AbsoluteFill style={{background: '#07070a'}}>
      <AbsoluteFill style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)',
        backgroundSize: '80px 80px', backgroundPosition: `${off}px ${off}px`,
      }} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%, rgba(255,59,48,.10) 0%, transparent 55%), radial-gradient(ellipse at center, transparent 40%, #000 100%)`}} />
      <svg width={width} height={height} style={{position: 'absolute'}}>
        {[0.32, 0.68].map((y, i) => (
          <line key={i} x1={0} x2={width * interpolate(f, [5 + i * 6, 40 + i * 6], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)})}
            y1={height * y} y2={height * y} stroke="rgba(255,255,255,.18)" strokeWidth={2} strokeDasharray="10 8" />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

// Curva naranja que se dibuja (como la de la referencia)
const Curva: React.FC<{start: number}> = ({start}) => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const p = interpolate(f - start, [0, 35], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const d = `M ${width * 0.05} ${height * 0.62} C ${width * 0.45} ${height * 0.62}, ${width * 0.55} ${height * 0.38}, ${width * 0.95} ${height * 0.38}`;
  return (
    <svg width={width} height={height} style={{position: 'absolute'}}>
      <path d={d} fill="none" stroke={NARANJA} strokeWidth={3} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p} opacity={0.85} />
      <circle cx={width * 0.05} cy={height * 0.62} r={7 * p} fill="none" stroke="#fff" strokeWidth={2} />
      <circle cx={width * 0.95} cy={height * 0.38} r={7 * p} fill="none" stroke="#fff" strokeWidth={2} />
    </svg>
  );
};

// Etiqueta técnica en mono
const Etiqueta: React.FC<{texto: string; x: string; y: string; delay: number}> = ({texto, x, y, delay}) => {
  const f = useCurrentFrame();
  const n = Math.floor(interpolate(f - delay, [0, 18], [0, texto.length], clamp));
  return <div style={{position: 'absolute', left: x, top: y, fontFamily: MONO, fontSize: 22, color: 'rgba(255,255,255,.45)', letterSpacing: 1}}>{texto.slice(0, n)}{n < texto.length && f > delay ? '▌' : ''}</div>;
};

// Palabra gigante: letras que suben con resorte; las indicadas en naranja
const Palabra: React.FC<{texto: string; delay: number; size: number; naranja?: number[]}> = ({texto, delay, size, naranja = []}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{display: 'flex', justifyContent: 'center', fontFamily: BIG, fontSize: size, lineHeight: 0.95, letterSpacing: -2}}>
      {texto.split('').map((ch, i) => {
        const s = spring({frame: f - delay - i * 2, fps, config: {damping: 14, stiffness: 140}});
        const esN = naranja.includes(i);
        return (
          <span key={i} style={{
            display: 'inline-block', transform: `translateY(${(1 - s) * 90}px) scale(${0.85 + s * 0.15})`, opacity: s,
            color: esN ? NARANJA : '#f4f4f5', whiteSpace: 'pre',
            textShadow: esN ? `0 0 40px rgba(255,59,48,.75)` : '0 0 30px rgba(255,255,255,.35), 0 8px 0 rgba(0,0,0,.35)',
          }}>{ch}</span>
        );
      })}
    </div>
  );
};

const Frase: React.FC<{texto: string; delay: number; size?: number; color?: string}> = ({texto, delay, size = 44, color = '#e4e4e7'}) => {
  const f = useCurrentFrame();
  const o = interpolate(f - delay, [0, 12], [0, 1], clamp);
  return <div style={{fontFamily: SANS, fontWeight: 700, fontSize: size, color, opacity: o, transform: `translateY(${(1 - o) * 20}px)`, textAlign: 'center'}}>{texto}</div>;
};

// Salida de cada escena: se desenfoca y se aleja
const Salida: React.FC<{dur: number; children: React.ReactNode}> = ({dur, children}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [dur - 10, dur], [1, 0], clamp);
  return <AbsoluteFill style={{opacity: o, filter: `blur(${(1 - o) * 12}px)`, transform: `scale(${1 + (1 - o) * 0.08})`, justifyContent: 'center', alignItems: 'center'}}>{children}</AbsoluteFill>;
};

export const Promo: React.FC = () => {
  const {width} = useVideoConfig();
  const vertical = width < 1500;
  const big = vertical ? 138 : 210;
  return (
    <AbsoluteFill>
      <Grid />
      <Etiqueta texto="fig. 01  //  bayolcell.com" x="6%" y="6%" delay={4} />
      <Etiqueta texto="taller · diagnóstico · garantía" x={vertical ? '6%' : '62%'} y={vertical ? '92%' : '90%'} delay={12} />

      <Sequence durationInFrames={95}>
        <Curva start={8} />
        <Salida dur={95}>
          <Frase texto="en Bayol Cell" delay={6} />
          <div style={{height: 18}} />
          <Palabra texto="REPARAMOS" delay={14} size={big} naranja={[8]} />
          <Palabra texto="TU CELULAR" delay={30} size={big * 0.82} />
        </Salida>
      </Sequence>

      <Sequence from={95} durationInFrames={105}>
        <Curva start={4} />
        <Salida dur={105}>
          <Frase texto="pantallas · baterías · cámaras · puertos" delay={4} size={vertical ? 36 : 44} color="rgba(255,255,255,.7)" />
          <div style={{height: 24}} />
          <Palabra texto="COMO" delay={10} size={big} />
          <Palabra texto="NUEVO" delay={22} size={big * 1.1} naranja={[0, 1, 2, 3, 4]} />
          <div style={{height: 28}} />
          <Frase texto="con garantía y diagnóstico gratis" delay={45} />
        </Salida>
      </Sequence>

      <Sequence from={200} durationInFrames={100}>
        <Salida dur={100}>
          <Palabra texto="BAYOL" delay={4} size={big * 1.05} />
          <Palabra texto="CELL" delay={14} size={big * 1.05} naranja={[0, 1, 2, 3]} />
          <div style={{height: 30}} />
          <Subrayado delay={30} />
          <div style={{height: 30}} />
          <Frase texto="Santiago · Moca · Navarrete" delay={36} />
          <div style={{height: 14}} />
          <Frase texto="Escríbenos por WhatsApp" delay={48} size={38} color={NARANJA} />
        </Salida>
      </Sequence>
    </AbsoluteFill>
  );
};

const Subrayado: React.FC<{delay: number}> = ({delay}) => {
  const f = useCurrentFrame();
  const w = interpolate(f - delay, [0, 20], [0, 520], {...clamp, easing: Easing.out(Easing.cubic)});
  return <div style={{width: w, height: 8, borderRadius: 4, background: NARANJA, boxShadow: `0 0 30px ${NARANJA}`}} />;
};
