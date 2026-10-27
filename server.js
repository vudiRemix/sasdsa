// Простой сервер для сайта: отдаёт файлы из этой папки.
// Запуск: node server.js  (порт берётся из PORT или SERVER_PORT, иначе 25990)
// Нужен только Node.js 14+, без установки пакетов.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || process.env.SERVER_PORT || 25990);
const HOST = process.env.HOST || '0.0.0.0';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
};
// Служебные файлы, которые не нужно отдавать наружу
const HIDDEN = /(^|\/)(\.|server\.(js|py)$|node_modules|tools\/|docs\/|README)/;

function send(res, status, file, headers) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      if (status === 404) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Not found'); }
      return send(res, 404, path.join(ROOT, '404.html'));
    }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(status, Object.assign({
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=604800',
      'X-Content-Type-Options': 'nosniff'
    }, headers));
    fs.createReadStream(file).pipe(res);
  });
}

http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  let rel;
  try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { res.writeHead(400); return res.end(); }
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(ROOT, rel));
  // Не выпускаем за пределы папки сайта и не отдаём служебные файлы
  if (!file.startsWith(ROOT + path.sep) || HIDDEN.test(path.relative(ROOT, file).split(path.sep).join('/'))) {
    return send(res, 404, path.join(ROOT, '404.html'));
  }
  send(res, 200, file);
}).listen(PORT, HOST, () => console.log(`Сайт запущен: http://${HOST}:${PORT}`));
