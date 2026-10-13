import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Sequence, Easing, staticFile, Img} from 'remotion';
import {loadFont} from '@remotion/fonts';

// Video vertical 30 s: animación de precios del cambio de cristal de iPhone (13 oct 2026).
const BIG = 'Archivo Black', SANS = 'Inter';
loadFont({family: BIG, url: staticFile('ArchivoBlack.woff2')});
loadFont({family: SANS, url: staticFile('Inter.woff2'), weight: '700'});
const ROJO = '#FF2A2A';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const PAGINAS: [string, number][][] = [
  [['X / XS / XR', 2000], ['XS Max', 2000], ['11', 2500], ['11 Pro Max', 3000], ['12 / 12 Pro', 3000]],
  [['12 Pro Max', 4000], ['13 / 13 Pro', 4000], ['13 Pro Max', 5500], ['14', 4500], ['14 Plus', 5000]],
  [['14 Pro', 6500], ['14 Pro Max', 6900], ['15 Plus', 6900], ['15 Pro', 9000], ['15 Pro Max', 10000]],
];
const fmt = (n: number) => n.toLocaleString('en-US');

export const Fondo: React.FC = () => {
  const f = useCurrentFrame();
  const a = f * 0.4;
  return (
    <AbsoluteFill style={{background: '#08080a'}}>
      <AbsoluteFill style={{background: `radial-gradient(900px 900px at ${70 + Math.sin(a / 40) * 10}% ${12 + Math.cos(a / 50) * 6}%, rgba(210,20,28,.55), transparent 60%), radial-gradient(800px 700px at 0% 100%, rgba(150,10,16,.4), transparent 60%)`}} />
      {[0, 1, 2].map((i) => (
        <div key={i} style={{position: 'absolute', left: -400, width: 2200, height: 6, top: 300 + i * 620,
          background: 'linear-gradient(90deg, transparent, rgba(255,40,40,.55), transparent)',
          transform: `rotate(-18deg) translateX(${((f * (6 + i * 2)) % 2400) - 1200}px)`, filter: 'blur(1px)'}} />
      ))}
    </AbsoluteFill>
  );
};

export const Logo: React.FC<{size?: number; top?: number}> = ({size = 300, top = 90}) => (
  <div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
    <div style={{width: size, height: size * 0.42, backgroundImage: `url(${staticFile('logo.png')})`, backgroundSize: `${size}px auto`, backgroundPosition: `center ${-size * 0.285}px`, backgroundRepeat: 'no-repeat'}} />
  </div>
);

const Letras: React.FC<{texto: string; delay: number; size: number; color?: string}> = ({texto, delay, size, color = '#fff'}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{display: 'flex', justifyContent: 'center', fontFamily: BIG, fontSize: size, lineHeight: 1.02, letterSpacing: -1}}>
      {texto.split('').map((ch, i) => {
        const s = spring({frame: f - delay - i * 1.5, fps, config: {damping: 13, stiffness: 150}});
        return <span key={i} style={{display: 'inline-block', whiteSpace: 'pre', color, opacity: s, transform: `translateY(${(1 - s) * 70}px)`,
          textShadow: color === ROJO ? '0 0 40px rgba(255,42,42,.7)' : '0 6px 0 rgba(0,0,0,.4)'}}>{ch}</span>;
      })}
    </div>
  );
};

const Telefono: React.FC<{src: string; delay: number; shake?: boolean}> = ({src, delay, shake}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - delay, fps, config: {damping: 15}});
  const dx = shake ? Math.sin(f * 2.3) * interpolate(f, [delay + 10, delay + 30], [14, 0], clamp) : 0;
  return (
    <div style={{position: 'absolute', bottom: 120, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <Img src={staticFile(src)} style={{height: 1080, opacity: s, transform: `translate(${dx}px, ${(1 - s) * 160}px) scale(${0.9 + s * 0.1}) rotate(${shake ? -4 : 3}deg)`,
        WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%)', filter: 'drop-shadow(0 40px 60px rgba(0,0,0,.7))'}} />
    </div>
  );
};

const Escena1: React.FC = () => (
  <AbsoluteFill>
    <Logo />
    <div style={{position: 'absolute', top: 290, left: 0, right: 0}}>
      <Letras texto="¿SE TE ROMPIÓ" delay={6} size={104} />
      <Letras texto="EL CRISTAL?" delay={20} size={128} color={ROJO} />
    </div>
    <Telefono src="rota.jpg" delay={10} shake />
  </AbsoluteFill>
);

const Escena2: React.FC = () => {
  const f = useCurrentFrame();
  const flash = interpolate(f, [0, 8], [1, 0], clamp);
  const {fps} = useVideoConfig();
  const b = spring({frame: f - 30, fps, config: {damping: 11}});
  return (
    <AbsoluteFill>
      <Logo />
      <div style={{position: 'absolute', top: 290, left: 0, right: 0}}>
        <Letras texto="TE LO DEJAMOS" delay={4} size={100} />
        <Letras texto="COMO NUEVO" delay={16} size={124} color={ROJO} />
      </div>
      <Telefono src="nueva.jpg" delay={0} />
      <div style={{position: 'absolute', bottom: 260, right: 90, transform: `scale(${b}) rotate(-8deg)`, background: ROJO, color: '#fff', fontFamily: BIG, fontSize: 54,
        padding: '22px 34px', borderRadius: 26, boxShadow: '0 20px 60px rgba(255,42,42,.6)', textAlign: 'center', lineHeight: 1}}>
        EN 2<br />HORAS
      </div>
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
    </AbsoluteFill>
  );
};

const Fila: React.FC<{m: string; v: number; delay: number}> = ({m, v, delay}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - delay, fps, config: {damping: 14, stiffness: 120}});
  const n = Math.round(interpolate(f - delay, [4, 22], [0, v], {...clamp, easing: Easing.out(Easing.cubic)}) / 10) * 10;
  return (
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 196, padding: '0 40px', marginBottom: 30,
      borderRadius: 30, background: 'linear-gradient(90deg, rgba(255,255,255,.08), rgba(255,255,255,.03))', border: '1px solid rgba(255,255,255,.12)',
      opacity: s, transform: `translateX(${(1 - s) * 260}px)`}}>
      <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 66, color: '#fff'}}><span style={{color: ROJO, marginRight: 18}}>›</span>{m}</div>
      <div style={{fontFamily: BIG, fontSize: 64, color: '#fff', background: ROJO, padding: '14px 28px', borderRadius: 22, boxShadow: '0 10px 30px rgba(255,42,42,.45)'}}>
        <span style={{fontSize: 34, marginRight: 6}}>RD$</span>{fmt(n)}
      </div>
    </div>
  );
};

const Precios: React.FC<{filas: [string, number][]; pagina: number}> = ({filas, pagina}) => {
  const f = useCurrentFrame();
  const salida = interpolate(f, [150, 170], [1, 0], clamp);
  return (
    <AbsoluteFill style={{opacity: salida}}>
      <Logo size={260} top={80} />
      <div style={{position: 'absolute', top: 290, left: 0, right: 0, textAlign: 'center'}}>
        <div style={{fontFamily: BIG, fontSize: 80, color: '#fff'}}>CAMBIO DE <span style={{color: ROJO}}>CRISTAL</span></div>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 40, color: '#d4d4d8', marginTop: 6}}>Pantalla de iPhone · {pagina}/3</div>
      </div>
      <div style={{position: 'absolute', top: 540, left: 60, right: 60}}>
        {filas.map(([m, v], i) => <Fila key={m} m={m} v={v} delay={8 + i * 9} />)}
      </div>
    </AbsoluteFill>
  );
};

const Beneficios: React.FC = () => {
  const f = useCurrentFrame();
  const items = ['Calidad garantizada', 'Listo en 2 horas', 'Cada reparación te da un boleto para la rifa'];
  return (
    <AbsoluteFill>
      <Logo />
      <div style={{position: 'absolute', top: 620, left: 80, right: 80}}>
        {items.map((t, i) => {
          const o = interpolate(f - i * 12, [0, 14], [0, 1], clamp);
          return <div key={t} style={{display: 'flex', alignItems: 'center', gap: 34, marginBottom: 70, opacity: o, transform: `translateY(${(1 - o) * 40}px)`}}>
            <div style={{width: 96, height: 96, borderRadius: 48, background: ROJO, color: '#fff', fontFamily: BIG, fontSize: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>✓</div>
            <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 64, color: '#fff', lineHeight: 1.15}}>{t}</div>
          </div>;
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Cierre: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const b = spring({frame: f - 14, fps, config: {damping: 10}});
  const pulso = 1 + Math.sin(f / 5) * 0.025;
  const tels = [['Santiago', '809-707-2493'], ['Moca', '829-670-9694'], ['Navarrete', '809-893-4412']];
  return (
    <AbsoluteFill>
      <Logo size={460} top={240} />
      <div style={{position: 'absolute', top: 560, left: 0, right: 0}}>
        <Letras texto="¡AGENDA AHORA!" delay={4} size={92} />
      </div>
      <div style={{position: 'absolute', top: 760, left: 90, right: 90, transform: `scale(${b * pulso})`, background: '#25D366', borderRadius: 999, padding: '34px 0',
        textAlign: 'center', fontFamily: BIG, fontSize: 46, color: '#fff', boxShadow: '0 20px 60px rgba(37,211,102,.45)'}}>ESCRÍBENOS POR WHATSAPP</div>
      <div style={{position: 'absolute', top: 1000, left: 90, right: 90}}>
        {tels.map(([s, n], i) => {
          const o = interpolate(f - 24 - i * 8, [0, 12], [0, 1], clamp);
          return <div key={s} style={{display: 'flex', justifyContent: 'space-between', padding: '30px 10px', borderBottom: '1px solid rgba(255,255,255,.15)', opacity: o}}>
            <span style={{fontFamily: SANS, fontWeight: 700, fontSize: 52, color: '#d4d4d8'}}>{s}</span>
            <span style={{fontFamily: BIG, fontSize: 56, color: '#fff'}}>{n}</span>
          </div>;
        })}
      </div>
      <div style={{position: 'absolute', bottom: 120, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 40, color: '#a1a1aa'}}>@bayolcell · bayolcell.com</div>
    </AbsoluteFill>
  );
};

export const Cristal: React.FC = () => (
  <AbsoluteFill>
    <Fondo />
    <Sequence durationInFrames={110}><Escena1 /></Sequence>
    <Sequence from={110} durationInFrames={100}><Escena2 /></Sequence>
    {PAGINAS.map((p, i) => (
      <Sequence key={i} from={210 + i * 170} durationInFrames={170}><Precios filas={p} pagina={i + 1} /></Sequence>
    ))}
    <Sequence from={720} durationInFrames={80}><Beneficios /></Sequence>
    <Sequence from={800} durationInFrames={100}><Cierre /></Sequence>
  </AbsoluteFill>
);
