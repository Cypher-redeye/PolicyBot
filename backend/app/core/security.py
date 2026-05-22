from datetime import datetime, timedelta, timezone
from jose import jwt
import bcrypt
import hashlib
import os
import base64
from app.core.config import settings


def hash_password(password: str) -> str:
    iterations = 100000
    salt = os.urandom(16)
    pwd_bytes = password.encode('utf-8')
    hashed = hashlib.pbkdf2_hmac('sha256', pwd_bytes, salt, iterations)
    salt_b64 = base64.b64encode(salt).decode('utf-8')
    hash_b64 = base64.b64encode(hashed).decode('utf-8')
    return f"pbkdf2_sha256${iterations}${salt_b64}${hash_b64}"


def verify_password(plain: str, hashed: str) -> bool:
    if hashed.startswith("pbkdf2_sha256$"):
        try:
            parts = hashed.split("$")
            if len(parts) != 4:
                return False
            iterations = int(parts[1])
            salt = base64.b64decode(parts[2].encode('utf-8'))
            hash_val = base64.b64decode(parts[3].encode('utf-8'))
            
            plain_bytes = plain.encode('utf-8')
            computed_hash = hashlib.pbkdf2_hmac('sha256', plain_bytes, salt, iterations)
            return computed_hash == hash_val
        except Exception:
            return False
    else:
        # Legacy bcrypt fallback
        try:
            plain_bytes = plain.encode('utf-8')
            hashed_bytes = hashed.encode('utf-8')
            return bcrypt.checkpw(plain_bytes, hashed_bytes)
        except Exception:
            return False


def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": subject, "exp": expire}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> str:
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    return payload.get("sub")
