// Servidor estático con gzip (como Cloudflare/GitHub Pages) para medir la carga de forma realista.
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib');
const RAIZ = require('path').resolve(__dirname, '..', '..'); const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2' };
http.createServer((req, res) => {
  const f = path.join(RAIZ, decodeURIComponent(req.url.split('?')[0])); if (!f.startsWith(RAIZ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  const ext = path.extname(f); const body = fs.readFileSync(f); const h = { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'max-age=600' };
  if (/^(text|application)/.test(h['Content-Type'])) { h['Content-Encoding'] = 'gzip'; res.writeHead(200, h); res.end(zlib.gzipSync(body)); } else { res.writeHead(200, h); res.end(body); }
}).listen(8788, '127.0.0.1');
