#!/usr/bin/env python3
"""Recorta la fuente de Tabler Icons 3.7.0 a los íconos que usa index.html de Bayol (05-nov-2026)."""
import re, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'py'))
from fontTools import subset

S = os.path.dirname(os.path.abspath(__file__))
repo = sys.argv[1]
html = open(os.path.join(repo, 'index.html'), encoding='utf-8').read()
nombres = set(re.findall(r'\bti-([a-z0-9]+(?:-[a-z0-9]+)*)', html))
nombres.discard('player')  # «ti-player-' + (p ? 'play' : 'pause')»
nombres |= {'player-play', 'player-pause'}
css = open(os.path.join(S, 'dl/tabler.css'), encoding='utf-8').read()
reglas, cps, faltan = [], [], []
for n in sorted(nombres):
    m = re.search(r'\.ti-' + re.escape(n) + r':before\{content:"\\([0-9a-f]+)"\}', css)
    if not m: faltan.append(n); continue
    cps.append(int(m.group(1), 16)); reglas.append(f'.ti-{n}:before{{content:"\\{m.group(1)}"}}')
if faltan: print('SIN GLIFO (no son íconos o no existen):', faltan)
os.makedirs(os.path.join(repo, 'assets/iconos'), exist_ok=True)
out = os.path.join(repo, 'assets/iconos/tabler-bc.woff2')
opts = subset.Options(); opts.flavor = 'woff2'; opts.layout_features = []; opts.name_IDs = []; opts.notdef_outline = True; opts.drop_tables += ['GSUB', 'GPOS', 'GDEF', 'morx', 'kern']
f = subset.load_font(os.path.join(S, 'dl/tabler.woff2'), opts)
[f.__delitem__(t) for t in ['GSUB', 'GPOS', 'GDEF'] if t in f]
sub = subset.Subsetter(opts); sub.populate(unicodes=cps); sub.subset(f)
subset.save_font(f, out, opts)
base = re.search(r'\.ti\{[^}]*\}', css).group(0)
bloque = ('@font-face{font-family:"tabler-icons";font-style:normal;font-weight:400;font-display:block;'
          'src:url("assets/iconos/tabler-bc.woff2?v=20261105") format("woff2")}' + base + ''.join(reglas))
print(len(cps), 'íconos ·', os.path.getsize(out), 'bytes ·', len(bloque), 'letras de CSS')
open(os.path.join(S, 'iconos.css'), 'w').write(bloque)
