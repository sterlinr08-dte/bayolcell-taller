import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, spring, interpolate, staticFile, useCurrentFrame, useVideoConfig, CalculateMetadataFunction} from 'remotion';
import {Fondo, Logo, Cierre} from './Cristal';

// Reel profesional a partir de un video grabado con el celular (13 oct 2026).
// Antes: python3 herramientas/procesar.py VIDEO.mp4 NOMBRE  (corta silencios, volumen de Instagram, palabras con su segundo).
const ROJO = '#FF2A2A';
const FPS = 30, CIERRE = 90;

type Palabra = {texto: string; ini: number; fin: number};
export type ReelProps = {carpeta: string; titulo?: string; resaltar?: string[]; palabras?: Palabra[]; duracion?: number};

export const calcularReel: CalculateMetadataFunction<ReelProps> = async ({props}) => {
  const datos = await fetch(staticFile(`${props.carpeta}/palabras.json`)).then((r) => r.json());
  return {durationInFrames: Math.ceil(datos.duracion * FPS) + CIERRE, props: {...props, palabras: datos.palabras, duracion: datos.duracion}};
};

// Grupos de hasta 3 palabras; corta también al final de una frase.
const agrupar = (ps: Palabra[]) => {
  const g: Palabra[][] = [];
  ps.forEach((p) => {
    const ult = g[g.length - 1];
    if (!ult || ult.length >= 3 || /[.!?]$/.test(ult[ult.length - 1].texto)) g.push([p]); else ult.push(p);
  });
  return g;
};

const Subtitulos: React.FC<{palabras: Palabra[]; resaltar: string[]}> = ({palabras, resaltar}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  const grupos = agrupar(palabras);
  const g = grupos.find((x, i) => t >= x[0].ini && t < (grupos[i + 1]?.[0].ini ?? x[x.length - 1].fin + 0.4));
  if (!g) return null;
  const entrada = spring({frame: f - Math.round(g[0].ini * fps), fps, config: {damping: 12, stiffness: 180}});
  const clave = (s: string) => resaltar.some((r) => s.toLowerCase().replace(/[^\p{L}\p{N}$]/gu, '').includes(r.toLowerCase()));
  return (
    <div style={{position: 'absolute', left: 60, right: 60, bottom: 430, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 22px',
      transform: `scale(${0.85 + entrada * 0.15})`, opacity: entrada}}>
      {g.map((p, i) => {
        const activa = t >= p.ini && t < p.fin + 0.05;
        const destacada = clave(p.texto);
        return (
          <span key={i} style={{fontFamily: 'Archivo Black', fontSize: 92, lineHeight: 1.05, textTransform: 'uppercase',
            color: destacada ? ROJO : '#fff', WebkitTextStroke: '3px #000', paintOrder: 'stroke fill',
            textShadow: '0 8px 24px rgba(0,0,0,.65)', transform: `translateY(${activa ? -6 : 0}px) scale(${activa ? 1.08 : 1})`,
            background: activa && !destacada ? 'rgba(255,42,42,.92)' : 'transparent', borderRadius: 18, padding: '0 14px'}}>{p.texto}</span>
        );
      })}
    </div>
  );
};

const Titulo: React.FC<{texto: string}> = ({texto}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - 4, fps, config: {damping: 14}});
  const sale = interpolate(f, [70, 85], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 260, left: 60, right: 60, textAlign: 'center', opacity: s * sale, transform: `translateY(${(1 - s) * -60}px)`}}>
      <span style={{fontFamily: 'Archivo Black', fontSize: 76, color: '#fff', background: ROJO, padding: '14px 30px', borderRadius: 24, lineHeight: 1.5,
        boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone', boxShadow: '0 20px 50px rgba(255,42,42,.5)'}}>{texto}</span>
    </div>
  );
};

export const Reel: React.FC<ReelProps> = ({carpeta, titulo, resaltar = ['bayol', 'rd$', 'whatsapp', 'gratis', 'horas', 'minutos'], palabras = [], duracion = 0}) => {
  const fin = Math.ceil(duracion * FPS);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence durationInFrames={fin}>
        <OffthreadVideo src={staticFile(`${carpeta}/video.mp4`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,.45) 0%, transparent 22%, transparent 60%, rgba(0,0,0,.55) 100%)'}} />
        <div style={{position: 'absolute', top: 70, left: 50, background: 'rgba(0,0,0,.35)', borderRadius: 24, padding: '4px 10px'}}>
          <div style={{position: 'relative', width: 230, height: 100}}><Logo size={230} top={0} /></div>
        </div>
        {titulo ? <Titulo texto={titulo} /> : null}
        <Subtitulos palabras={palabras} resaltar={resaltar} />
      </Sequence>
      <Sequence from={fin} durationInFrames={CIERRE}><Fondo /><Cierre /></Sequence>
    </AbsoluteFill>
  );
};
