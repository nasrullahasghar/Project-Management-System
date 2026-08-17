from pydantic import EmailStr , Field
from app.schemas.base import CamelModel


class RegisterRequest(CamelModel):
    full_name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=1,max_length=8)
    role: str 

class LoginRequest(CamelModel):
    email: EmailStr
    password: str = Field(min_length=1,max_length=8)

class AuthResponse(CamelModel):
    token: str
    full_name: str
    email: str
    role: str




