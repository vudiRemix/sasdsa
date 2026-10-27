#!/usr/bin/env python3
"""
Простой сервер для сайта: отдаёт файлы из этой папки.
Запуск: python3 server.py  (порт берётся из PORT или SERVER_PORT, иначе 25990)
Нужен только Python 3.7+, без установки пакетов.
"""
import http.server
import os
import re

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get('PORT') or os.environ.get('SERVER_PORT') or 25990)
HIDDEN = re.compile(r'(^|/)(\.|server\.(js|py)$|node_modules|tools/|docs/|README)')


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.webp': 'image/webp', '.woff2': 'font/woff2', '.svg': 'image/svg+xml',
        '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html; charset=utf-8',
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()  # отдаст index.html или 404 вместо списка файлов
        rel = os.path.relpath(path, ROOT).replace(os.sep, '/')
        if HIDDEN.search(rel) or (not os.path.exists(path)):
            return self.not_found()
        return super().send_head()

    def not_found(self):
        page = os.path.join(ROOT, '404.html')
        with open(page, 'rb') as f:
            body = f.read()
        self.send_response(404)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(body)
        return None

    def end_headers(self):
        html = self.path.endswith('.html') or self.path.endswith('/') or '?' in self.path
        self.send_header('Cache-Control', 'no-cache' if html else 'public, max-age=604800')
        super().end_headers()

    def list_directory(self, path):
        return self.not_found()


if __name__ == '__main__':
    with http.server.ThreadingHTTPServer(('0.0.0.0', PORT), Handler) as srv:
        print(f'Сайт запущен: http://0.0.0.0:{PORT}')
        srv.serve_forever()
