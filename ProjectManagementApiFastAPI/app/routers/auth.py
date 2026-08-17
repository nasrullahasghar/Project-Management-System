from sqlalchemy import select
from app.database.models import User
from app.database.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends , status , APIRouter  , HTTPException
from app.schemas.auth import RegisterRequest , LoginRequest , AuthResponse
from app.core.security import hash_password , create_access_token , verify_password

router = APIRouter(prefix="/api/auth",tags=["Auth"])

VALID_ROLES = ("Admin", "ProjectManager", "TeamMember")


# <============> Register Router <============>

@router.post("/register",response_model=AuthResponse)
async def register_user(
    
    request:RegisterRequest,db:AsyncSession=Depends(get_db)):
        # Same Duplicate Email Checking
        existing = await db.scalar(select(User).where(User.email == request.email))
        if existing is not None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="A User With Email Already Exists.")

        # Valid User Role Checking
        if request.role not in VALID_ROLES:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail=f"Invalid Role '{request.role}'.Must one of: {', '.join(VALID_ROLES)}")

        # Create the new User
        user  = User(
            full_name = request.full_name,
            email = request.email,
            password_hash = hash_password(request.password),
            role = request.role
        )

        db.add(user)
        await db.commit()
        await db.refresh(user)

        token = create_access_token(user.id,user.email,user.full_name,user.role)
        return AuthResponse(token=token,full_name=user.full_name,email=user.email,role=user.role)

# <============> Login Router <============>
@router.post(path="/login",response_model=AuthResponse)
async def login(request:LoginRequest,db:AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == request.email))
    # Invalid Credentials Checking
    if user is None or not verify_password(request.password,user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Email or Password"
        )
    token = create_access_token(user_id=user.id,email=user.email,full_name=user.full_name,role=user.role)
    return AuthResponse(token=token, full_name=user.full_name,email=user.email,role=user.role)

