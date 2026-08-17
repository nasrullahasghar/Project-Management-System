from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import get_db
from app.database.models import User, TeamMember
from app.schemas.users import UserResponse
from app.core.dependencies import require_roles

router = APIRouter(prefix="/api/users", tags=["Users"])


# GET /api/users
# GET /api/users?excludeProjectId=5
# Controller-level [Authorize(Roles = "Admin,ProjectManager")] in the .NET
# version - every action on this controller requires one of those roles,
# unlike Projects/Tasks/TeamMembers where only writes were role-gated.
@router.get("", response_model=list[UserResponse])
async def get_users(
    exclude_project_id: Optional[int] = Query(default=None, alias="excludeProjectId"),
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(require_roles("Admin", "ProjectManager")),
):
    query = select(User)

    if exclude_project_id is not None:
        # Equivalent to the .NET !_context.TeamMembers.Any(...) check -
        # exclude any user who already has a TeamMember row for this project.
        member_user_ids = select(TeamMember.user_id).where(
            TeamMember.project_id == exclude_project_id
        )
        query = query.where(~User.id.in_(member_user_ids))

    result = await db.execute(query)
    users = result.scalars().all()

    return [
        UserResponse(id=u.id, full_name=u.full_name, email=u.email, role=u.role)
        for u in users
    ]