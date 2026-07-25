"""KSP CrimeIntel — Auth (JWT + Role-Based Access)"""

import os
import jwt
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict

SECRET_KEY  = os.getenv("JWT_SECRET", "ksp-crimeintel-secret-2026-very-secure-32-byte-key")
ALGORITHM   = "HS256"
TOKEN_TTL   = 480   # minutes (8 hours)


class AuthManager:
    def __init__(self, data_engine=None):
        self.db = data_engine

    def authenticate(self, username: str, password: str) -> Optional[Dict]:
        if not self.db:
            return None

        u_clean = username.strip().lower()
        # Query by either Username or User ID (e.g. USR-A1B2C3)
        user = self.db.conn.execute(
            "SELECT id, username, password_hash, role, badge FROM users WHERE LOWER(username) = ? OR LOWER(id) = ?",
            (u_clean, u_clean)
        ).fetchone()

        if not user:
            return None

        stored_pw = user[2]
        input_hash = hashlib.sha256(password.encode()).hexdigest()

        # Support both hashed passwords and legacy plaintext passwords
        if stored_pw != password and stored_pw != input_hash:
            return None

        user_id = user[0]
        uname   = user[1]
        role    = user[3]
        badge   = user[4]

        permissions = ["read", "export"]
        if role == "admin":
            permissions.extend(["admin", "write"])

        payload = {
            "sub":   uname,
            "id":    user_id,
            "role":  role,
            "badge": badge,
            "name":  uname.title(),
            "exp":   datetime.now(timezone.utc) + timedelta(minutes=TOKEN_TTL),
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        return {
            "access_token": token,
            "token_type":   "bearer",
            "user": {
                "id":          user_id,
                "username":    uname,
                "role":        role,
                "name":        uname.title(),
                "badge":       badge,
                "permissions": permissions,
            },
        }

    def get_current_user(self, token: str) -> Optional[Dict]:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            username = payload.get("sub")
            if not username:
                return None

            user = self.db.conn.execute(
                "SELECT id, username, role, badge FROM users WHERE LOWER(username) = ? OR LOWER(id) = ?",
                (username.lower(), username.lower())
            ).fetchone()
            if not user:
                return None

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
