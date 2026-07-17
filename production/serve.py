#!/usr/bin/env python3
"""Stable threaded dev server — use instead of `python3 -m http.server 3000`.
Each request gets its own thread so a dropped connection can't kill the server."""
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 3000

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        # suppress per-request noise; only print errors
        if int(args[1]) >= 400:
            super().log_message(fmt, *args)

os.chdir(os.path.dirname(os.path.abspath(__file__)))

with ThreadingHTTPServer(("", PORT), QuietHandler) as httpd:
    print(f"serving at http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
