from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    is_active: bool
    preferred_language: str = "English"
    role: str = "employee"

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    preferred_language: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
