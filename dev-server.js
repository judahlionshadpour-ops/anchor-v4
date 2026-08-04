// Local dev server: mirrors Vercel's static + /api/*.js function routing
// without needing `vercel login`. Deploys to Vercel unchanged.
require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8429;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json',
};

function parseJsonBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { resolve({}); }
    });
  });
}

function makeRes(res) {
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)); };
  return res;
}

const server = http.createServer(async (req, res) => {
  const urlPath = req.url.split('?')[0];

  if (urlPath.startsWith('/api/')) {
    const fnName = urlPath.replace('/api/', '');
    const fnPath = path.join(ROOT, 'api', `${fnName}.js`);
    if (!fs.existsSync(fnPath)) { res.writeHead(404); res.end('Not found'); return; }

    delete require.cache[require.resolve(fnPath)];
    const handler = require(fnPath);
    makeRes(res);

    if (handler.config?.api?.bodyParser === false) {
      // Webhook route reads the raw body itself.
      await handler(req, res);
    } else {
      req.body = req.method === 'POST' ? await parseJsonBody(req) : {};
      await handler(req, res);
    }
    return;
  }

  let filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404); res.end('Not found'); return;
  }
  const ext = path.extname(filePath);
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => console.log(`ANCHOR dev server on http://localhost:${PORT}`));
