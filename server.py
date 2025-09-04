#!/usr/bin/env python3
import http.server
import socketserver
import json
import os
from urllib.parse import urlparse

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/characters':
            self.send_characters()
        else:
            super().do_GET()
    
    def send_characters(self):
        try:
            with open('data/characters.json', 'r', encoding='utf-8') as f:
                characters_data = json.load(f)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = json.dumps(characters_data, ensure_ascii=False)
            self.wfile.write(response.encode('utf-8'))
        except FileNotFoundError:
            self.send_error(404, 'Characters file not found')
        except Exception as e:
            self.send_error(500, f'Server error: {str(e)}')

if __name__ == "__main__":
    PORT = 3002
    os.chdir('/home/horuzen/Meu RPG/rpgstack')
    
    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        print(f"Server running at http://localhost:{PORT}")
        httpd.serve_forever()