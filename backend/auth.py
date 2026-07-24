"""KSP CrimeIntel — Auth (JWT + Role-Based Access)"""

import os
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict

SECRET_KEY  = os.getenv("JWT_SECRET", "ksp-crimeintel-secret-2026-very-secure-32-byte-key")
ALGORITHM   = "HS256"
TOKEN_TTL   = 480   # minutes (8 hours)

# Demo credential store — replace with DB in production
USERS: Dict[str, Dict] = {
    "admin": {
        "password": "admin",
        "role": "admin",
        "name": "System Administrator",
        "badge": "ADMIN-001",
        "permissions": ["read", "write", "export", "admin"],
    },
    "investigator": {
        "password": "invest123",
        "role": "investigator",
        "name": "Inspector R. Kumar",
        "badge": "INV-1234",
        "permissions": ["read", "export"],
    },
    "analyst": {
        "password": "analyst123",
        "role": "analyst",
        "name": "Sr. Analyst S. Nair",
        "badge": "ANL-5678",
        "permissions": ["read", "export"],
    },
}


class AuthManager:
    def __init__(self, data_engine=None):
        self.db = data_engine

    def authenticate(self, username: str, password: str) -> Optional[Dict]:
        if not self.db:
            return None
        user = self.db.conn.execute("SELECT id, username, password_hash, role, badge FROM users WHERE username = ?", (username.lower(),)).fetchone()
        if not user or user[2] != password:
            return None
        
        # Permissions mapping based on role
        permissions = ["read", "export"]
        if user[3] == "admin":
            permissions.append("admin")
            permissions.append("write")
            
        payload = {
            "sub":  username,
            "role": user[3],
            "badge": user[4],
            "name": username.title(),
            "exp":  datetime.now(timezone.utc) + timedelta(minutes=TOKEN_TTL),
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        return {
            "access_token": token,
            "token_type":   "bearer",
            "user": {
                "id":          user[0],
                "username":    user[1],
                "role":        user[3],
                "name":        username.title(),
                "badge":       user[4],
                "permissions": permissions,
            },
        }

    def get_current_user(self, token: str) -> Optional[Dict]:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            username = payload.get("sub")
            if not username: return None
            
            # Optionally query DB again to ensure user still exists
            user = self.db.conn.execute("SELECT id, username, role, badge FROM users WHERE username = ?", (username,)).fetchone()
            if not user: return None
            
            permissions = ["read", "export"]
            if user[2] == "admin":
                permissions.extend(["admin", "write"])
                
            return {
                "id":          user[0],
                "username":    user[1],
                "role":        user[2],
                "name":        user[1].title(),
                "badge":       user[3],
                "permissions": permissions,
            }
        except jwt.PyJWTError:
            return None
