from fastapi import HTTPException, status
from app.schemas.user import UserCreate
from app.core.security import hash_password, verify_password, create_access_token
from app.core import supabase_db


def register_user(data: UserCreate) -> dict:
    # Check if email already registered
    existing = supabase_db.select("users", filters={"email": data.email})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = supabase_db.insert("users", {
        "email": data.email,
        "hashed_password": hash_password(data.password),
        "is_active": True,
        "is_superuser": False,
        "role": "employee"
    })
    return user


def login_user(email: str, password: str) -> str:
    users = supabase_db.select("users", filters={"email": email})
    if not users:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    user = users[0]
    if not verify_password(password, user["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return create_access_token(subject=user["email"])


def update_language(user_id: str, language: str) -> dict:
    updated = supabase_db.update("users", {"id": user_id}, {"preferred_language": language})
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return updated[0]
