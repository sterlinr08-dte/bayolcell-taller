#!/usr/bin/env bash
# Deja listas las herramientas de video en una sesión nueva (la nube se borra al cerrar).
set -e
cd "$(dirname "$0")/.."
pip install -q faster-whisper silero-vad imageio-ffmpeg onnxruntime numpy
npm install --silent
echo "Listo: Remotion + FFmpeg + Whisper + Silero."
