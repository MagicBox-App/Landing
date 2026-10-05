// Servidor de desarrollo local: sirve estáticos + ejecuta las funciones de api/
// Uso: node dev-server.js
require('dotenv').config({ quiet: true });
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8934;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.webm': 'video/webm'
};

/* Igual que Vercel: cada api/<nombre>.js es un endpoint /api/<nombre>; los
   archivos que empiezan con _ son modulos compartidos, no endpoints. */
const API_HANDLERS = {};
fs.readdirSync(path.join(ROOT, 'api')).forEach((f) => {
  if (f.endsWith('.js') && !f.startsWith('_')) API_HANDLERS['/api/' + f.slice(0, -3)] = require('./api/' + f);
});

function fakeVercelReqRes(req, res, body) {
  req.body = body;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)); };
  res.send = (str) => { res.end(str); return res; };
  return { req, res };
}

/* Twilio manda application/x-www-form-urlencoded (Body, From, To, etc),
   no JSON -- Vercel lo parsea solo en produccion, pero este servidor de
   desarrollo simple tiene que hacerlo a mano segun el Content-Type. */
function parseBody(raw, contentType) {
  if ((contentType || '').indexOf('application/x-www-form-urlencoded') !== -1) {
    const out = {};
    new URLSearchParams(raw).forEach((v, k) => { out[k] = v; });
    return out;
  }
  try { return JSON.parse(raw); } catch { return {}; }
}

const server = http.createServer((req, res) => {
  const apiPath = req.url.split('?')[0];
  if (API_HANDLERS[apiPath]) {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', async () => {
      const body = parseBody(data, req.headers['content-type']);
      const { req: fReq, res: fRes } = fakeVercelReqRes(req, res, body);
      const handler = API_HANDLERS[apiPath];
      try {
        await handler(fReq, fRes);
      } catch (err) {
        console.error('Handler error:', err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal error' }));
      }
    });
    return;
  }

  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/_preview_prototipo.html';
  const filePath = path.join(ROOT, decodeURIComponent(urlPath));

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.statusCode = 404;
      res.end('404 Not Found: ' + urlPath);
      return;
    }
    const ext = path.extname(filePath);
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`✓ Dev server corriendo en http://localhost:${PORT} (APIs: ${Object.keys(API_HANDLERS).join(', ')})`);
  console.log(`✓ Keys cargadas: ${(process.env.GEMINI_API_KEYS || '').split(',').filter(Boolean).length}`);
});
