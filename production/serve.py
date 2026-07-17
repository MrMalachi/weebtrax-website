#!/usr/bin/env python3
"""Stable threaded dev server — use instead of `python3 -m http.server 3000`.
Each request gets its own thread; broken connections and SIGTERM are handled
gracefully so the server never crashes mid-session."""
import os
import signal
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 3000

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass

class StableServer(ThreadingHTTPServer):
    """Suppress BrokenPipeError / ConnectionResetError from dropped connections."""
    def handle_error(self, request, client_address):
        exc = sys.exc_info()[1]
        if isinstance(exc, (BrokenPipeError, ConnectionResetError)):
            return
        super().handle_error(request, client_address)

# Ignore SIGTERM so zsh background-job management can't kill the process.
# Stop with Ctrl-C (SIGINT) or `kill -INT <pid>` instead.
signal.signal(signal.SIGTERM, signal.SIG_IGN)

os.chdir(os.path.dirname(os.path.abspath(__file__)))

with StableServer(("", PORT), QuietHandler) as httpd:
    print(f"serving at http://localhost:{PORT}  (Ctrl-C to stop)")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
