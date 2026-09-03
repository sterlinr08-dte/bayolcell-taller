from pathlib import Path

TARGET = Path('taller.html')
TAG = '<link rel="stylesheet" href="crm-glass-mobile.css?v=20260903">'

text = TARGET.read_text(encoding='utf-8')

if TAG in text:
    print('CRM glass stylesheet already linked; no changes needed.')
    raise SystemExit(0)

marker = '</head>'
if marker not in text:
    raise SystemExit('No se encontró </head> en taller.html')

text = text.replace(marker, f'    {TAG}\n{marker}', 1)
TARGET.write_text(text, encoding='utf-8')
print('Injected crm-glass-mobile.css link into taller.html')
