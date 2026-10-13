#!/usr/bin/env python3
"""Prepara un video grabado con el celular para el reel de Bayol Cell.

1. Silero encuentra dónde se habla y se cortan los silencios largos.
2. FFmpeg arma el video cortado (vertical 1080x1920, 30 fps) con el volumen de Instagram (-14 LUFS).
3. Whisper escribe cada palabra con su segundo exacto (para los subtítulos).

Uso:
  python3 herramientas/procesar.py VIDEO.mp4 NOMBRE [--modelo small|medium] [--pausa 0.35]
Deja en public/NOMBRE/: video.mp4 y palabras.json. Luego:
  npx remotion render src/index.ts Reel salida.mp4 --props='{"carpeta":"NOMBRE"}'
"""
import argparse, json, os, re, subprocess, sys, tempfile

import imageio_ffmpeg
from faster_whisper import WhisperModel
import wave
import numpy as np
import torch
from silero_vad import load_silero_vad, get_speech_timestamps

FF = imageio_ffmpeg.get_ffmpeg_exe()
# Correcciones de palabras que Whisper suele escribir mal.
ARREGLOS = {'ballol': 'Bayol', 'bayo': 'Bayol', 'vayol': 'Bayol', 'bayolsel': 'BayolCell', 'whatsap': 'WhatsApp', 'aifon': 'iPhone'}
AQUI = os.path.dirname(os.path.abspath(__file__))


def ff(*args):
    subprocess.run([FF, '-y', '-loglevel', 'error', *args], check=True)


def tramos_de_voz(wav, pausa, margen=0.12):
    """Tramos [ini, fin] con voz; une los que están separados por menos de `pausa` segundos."""
    modelo = load_silero_vad()
    with wave.open(wav) as w:
        audio = torch.from_numpy(np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0)
    ts = get_speech_timestamps(audio, modelo, sampling_rate=16000, return_seconds=True)
    dur = len(audio) / 16000
    tramos = []
    for t in ts:
        ini, fin = max(0.0, t['start'] - margen), min(dur, t['end'] + margen)
        if tramos and ini - tramos[-1][1] < pausa:
            tramos[-1][1] = fin
        else:
            tramos.append([ini, fin])
    return tramos, dur


def cortar(video, tramos, salida):
    partes = []
    for i, (a, b) in enumerate(tramos):
        partes.append(f"[0:v]trim={a:.3f}:{b:.3f},setpts=PTS-STARTPTS[v{i}];[0:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS[a{i}]")
    une = ''.join(f'[v{i}][a{i}]' for i in range(len(tramos)))
    filtro = ';'.join(partes) + f";{une}concat=n={len(tramos)}:v=1:a=1[v][a];" \
        "[v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30[vo];" \
        "[a]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[ao]"
    ff('-i', video, '-filter_complex', filtro, '-map', '[vo]', '-map', '[ao]',
       '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', salida)


def transcribir(wav, nombre_modelo):
    modelo = WhisperModel(nombre_modelo, device='cpu', compute_type='int8')
    segs, _ = modelo.transcribe(wav, language='es', word_timestamps=True, vad_filter=False, beam_size=5,
                                 initial_prompt='Bayol Cell, BayolCell, iPhone, Samsung, Xiaomi, WhatsApp, Santiago, Moca, Navarrete, pantalla, batería, cristal, RD$.')
    palabras = []
    for s in segs:
        for w in s.words:
            t = w.word.strip()
            base = t.strip('¡!¿?.,').lower()
            if base in ARREGLOS:
                t = t.lower().replace(base, ARREGLOS[base])
            palabras.append({'texto': t, 'ini': round(w.start, 3), 'fin': round(w.end, 3)})
    return precios(palabras)


def precios(ps):
    """«2000 pesos» / «2.000» / «RD$ 2000» -> «RD$2,000» en una sola palabra (como en los flyers)."""
    out = []
    for p in ps:
        t = p['texto']
        num = re.sub(r'[^0-9]', '', t)
        cola = re.sub(r'^[0-9.,$RDrd]+', '', t)
        es_num = num and re.fullmatch(r'(RD\$)?[0-9][0-9.,]*[.,!?]?', t, re.I)
        if es_num and int(num) >= 100:
            if out and out[-1]['texto'].lower().rstrip('.,') in ('rd$', 'rd', 'rds'):
                p = {**p, 'ini': out.pop()['ini']}
            out.append({**p, 'texto': f'RD${int(num):,}' + (cola if cola in '.,!?' else '')})
            continue
        base = t.lower().strip('.,!?')
        if base in ('pesos', 'peso') and out and out[-1]['texto'].startswith('RD$'):
            out[-1] = {**out[-1], 'fin': p['fin'], 'texto': out[-1]['texto'].rstrip('.,!?') + t[len(base):]}
            continue
        out.append(p)
    return out


def main():
    p = argparse.ArgumentParser()
    p.add_argument('video'); p.add_argument('nombre')
    p.add_argument('--modelo', default='small'); p.add_argument('--pausa', type=float, default=0.35)
    a = p.parse_args()
    dest = os.path.join(AQUI, '..', 'public', a.nombre)
    os.makedirs(dest, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        wav = os.path.join(tmp, 'a.wav')
        ff('-i', a.video, '-vn', '-ac', '1', '-ar', '16000', wav)
        tramos, dur = tramos_de_voz(wav, a.pausa)
        if not tramos:
            sys.exit('No se encontró voz en el video.')
        final = os.path.join(dest, 'video.mp4')
        cortar(a.video, tramos, final)
        wav2 = os.path.join(tmp, 'b.wav')
        ff('-i', final, '-vn', '-ac', '1', '-ar', '16000', wav2)
        palabras = transcribir(wav2, a.modelo)
    nuevo = sum(b - x for x, b in tramos)
    json.dump({'duracion': round(nuevo, 3), 'palabras': palabras}, open(os.path.join(dest, 'palabras.json'), 'w'), ensure_ascii=False, indent=1)
    print(f'Original {dur:.1f} s -> cortado {nuevo:.1f} s ({len(tramos)} tramos). {len(palabras)} palabras.')
    print(' '.join(w['texto'] for w in palabras))


if __name__ == '__main__':
    main()
