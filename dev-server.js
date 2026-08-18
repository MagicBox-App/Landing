// Servidor de desarrollo local: sirve estáticos + ejecuta api/chat.js
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

const chatHandler = require('./api/chat.js');

function fakeVercelReqRes(req, res, body) {
  req.body = body;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)); };
  return { req, res };
}

const server = http.createServer((req, res) => {
  if (req.url === '/api/chat' && req.method === 'POST') {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', async () => {
      let body;
      try { body = JSON.parse(data); } catch { body = {}; }
      const { req: fReq, res: fRes } = fakeVercelReqRes(req, res, body);
      try {
        await chatHandler(fReq, fRes);
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
  console.log(`✓ Dev server con /api/chat corriendo en http://localhost:${PORT}`);
  console.log(`✓ Keys cargadas: ${(process.env.GEMINI_API_KEYS || '').split(',').filter(Boolean).length}`);
});
