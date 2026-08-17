from app.schemas.base import CamelModel


class UserResponse(CamelModel):
    id: int
    full_name: str
    email: str
    role: str