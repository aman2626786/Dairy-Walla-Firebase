#!/usr/bin/env python3
"""
DairySetu - Local server launcher
Run: python app.py
"""

import http.server
import socketserver
import os
import webbrowser
import threading
import time

PORT = 8080
DIST_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dairy-setu", "dist")


class SPAHandler(http.server.SimpleHTTPRequestHandler):
    """Serve a Single Page Application — all unknown paths return index.html."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST_DIR, **kwargs)

    def do_GET(self):
        requested = os.path.join(DIST_DIR, self.path.lstrip("/"))
        if os.path.isfile(requested):
            super().do_GET()
        else:
            self.path = "/index.html"
            super().do_GET()

    def log_message(self, format, *args):
        pass  # suppress noisy logs


def open_browser(port):
    time.sleep(1.2)
    webbrowser.open(f"http://localhost:{port}")


if __name__ == "__main__":
    if not os.path.isdir(DIST_DIR):
        print("Build nahi mila. Pehle ye run karo:")
        print("  cd dairy-setu && npm run build")
        exit(1)

    print("=" * 50)
    print("  DairySetu")
    print("=" * 50)
    print(f"  http://localhost:{PORT}")
    print(f"  Browser automatically khul raha hai...")
    print(f"  Band karne ke liye: Ctrl+C")
    print("=" * 50)

    threading.Thread(target=open_browser, args=(PORT,), daemon=True).start()

    with socketserver.TCPServer(("", PORT), SPAHandler) as httpd:
        httpd.allow_reuse_address = True
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n  Server band ho gaya.")
