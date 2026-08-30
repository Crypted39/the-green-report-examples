// Minimal static file server, no dependencies. Serves demo-site/ on port 3100.
// Port 3000 is deliberately avoided: it is the default for a lot of dev servers
// (Next.js, CRA, NestJS), and a stray one there will silently answer these tests.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 3100;
const HOST = '127.0.0.1';
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  const filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
});

// Fail loudly instead of leaving Playwright to time out on someone else's server.
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `Port ${PORT} is already in use. Stop whatever owns it, or run with a different PORT.`
    );
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, HOST, () => {
  console.log(`Demo site running at http://${HOST}:${PORT}`);
});
