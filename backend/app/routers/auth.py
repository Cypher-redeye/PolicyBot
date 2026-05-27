from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.user import UserCreate, UserResponse, Token, UserUpdate
from app.services.auth_service import register_user, login_user, update_language
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=201)
def register(data: UserCreate):
    return register_user(data)


@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends()):
    token = login_user(form.username, form.password)
    return {"access_token": token}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user


@router.patch("/me/language", response_model=UserResponse)
def patch_language(data: UserUpdate, current_user: dict = Depends(get_current_user)):
    return update_language(current_user["id"], data.preferred_language)
