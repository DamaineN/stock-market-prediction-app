from http.server import BaseHTTPRequestHandler
import json
import jwt
from datetime import datetime, timedelta
import os

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            email = data.get('email', '')
            password = data.get('password', '')
            
            # Hardcoded admin user
            if email == "admin@stolckr.com" and password == "admin123":
                token_data = {
                    "sub": "admin_hardcoded",
                    "email": "admin@stolckr.com",
                    "role": "admin",
                    "exp": datetime.utcnow() + timedelta(hours=24)
                }
                secret_key = os.getenv("JWT_SECRET_KEY", "your-secret-key")
                access_token = jwt.encode(token_data, secret_key, algorithm="HS256")
                
                response = {
                    "access_token": access_token,
                    "refresh_token": access_token,  # Same for simplicity
                    "expires_in": 24 * 3600,
                    "token_type": "bearer"
                }
                
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Test user
            if email == "test@stolckr.com" and password == "password123":
                token_data = {
                    "sub": "test_user",
                    "email": "test@stolckr.com", 
                    "role": "beginner",
                    "exp": datetime.utcnow() + timedelta(hours=24)
                }
                secret_key = os.getenv("JWT_SECRET_KEY", "your-secret-key")
                access_token = jwt.encode(token_data, secret_key, algorithm="HS256")
                
                response = {
                    "access_token": access_token,
                    "refresh_token": access_token,
                    "expires_in": 24 * 3600,
                    "token_type": "bearer"
                }
                
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Invalid credentials
            self.send_response(401)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            error_response = {
                "error": "Invalid email or password"
            }
            self.wfile.write(json.dumps(error_response).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            error_response = {
                "error": f"Server error: {str(e)}"
            }
            self.wfile.write(json.dumps(error_response).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()