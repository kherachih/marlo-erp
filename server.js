const http = require('http');
const fs = require('fs');
const path = require('path');
const { handleApiRequest } = require('./api/routes');

const PORT = process.env.PORT || 3333;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let reqPath = decodeURI(url.pathname);
  console.log(`[HTTP] ${req.method} ${reqPath}`);

  // 1. Délégation des requêtes API REST
  if (reqPath.startsWith('/api/')) {
    return handleApiRequest(req, res);
  }

  // 2. Normalisation du préfixe /marlo/ si présent
  if (reqPath.startsWith('/marlo/')) {
    reqPath = reqPath.slice(6);
  } else if (reqPath === '/marlo') {
    reqPath = '/';
  }

  let filePath = path.join(ROOT, reqPath === '/' ? 'index.html' : reqPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback SPA vers index.html
      const fallback = path.join(ROOT, 'index.html');
      fs.readFile(fallback, (fErr, content) => {
        if (fErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(content);
        }
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': mime,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*'
    });

    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Marlo ERP & SaaS Platform is running at: http://localhost:${PORT}/#/overview`);
  console.log(`📡 Multi-Tenant REST API active on: http://localhost:${PORT}/api/tenants`);
  console.log(`Press Ctrl+C to stop.\n`);
});
