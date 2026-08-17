from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.database import get_db
from app.database.models import TeamMember, Project, User
from app.schemas.team_members import AddTeamMemberRequest, UpdateTeamMemberRequest, TeamMemberResponse
from app.core.dependencies import get_current_user_claims, require_roles

router = APIRouter(prefix="/api/projects/{project_id}/teammembers", tags=["TeamMembers"])


async def _project_exists(db: AsyncSession, project_id: int) -> bool:
    result = await db.scalar(select(Project.id).where(Project.id == project_id))
    return result is not None


async def _user_exists(db: AsyncSession, user_id: int) -> bool:
    result = await db.scalar(select(User.id).where(User.id == user_id))
    return result is not None


def _to_response(member: TeamMember) -> TeamMemberResponse:
    return TeamMemberResponse(
        id=member.id,
        role_in_project=member.role_in_project,
        joined_at=member.joined_at,
        project_id=member.project_id,
        user_id=member.user_id,
        user_full_name=member.user.full_name,
        user_email=member.user.email,
    )


# GET /api/projects/{project_id}/teammembers - any authenticated user
@router.get("", response_model=list[TeamMemberResponse])
async def get_team_members(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(get_current_user_claims),
):
    if not await _project_exists(db, project_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with id {project_id} not found.",
        )

    result = await db.execute(
        select(TeamMember)
        .where(TeamMember.project_id == project_id)
        .options(selectinload(TeamMember.user))
    )
    members = result.scalars().all()
    return [_to_response(m) for m in members]


# POST /api/projects/{project_id}/teammembers - Admin or ProjectManager only
@router.post("", response_model=TeamMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_team_member(
    project_id: int,
    request: AddTeamMemberRequest,
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(require_roles("Admin", "ProjectManager")),
):
    if not await _project_exists(db, project_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with id {project_id} not found.",
        )

    if not await _user_exists(db, request.user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with id {request.user_id} does not exist.",
        )

    # Pre-check the unique (ProjectId, UserId) constraint ourselves, so we can
    # return a clean 409 Conflict instead of letting Postgres raise a raw
    # IntegrityError - same reasoning as the .NET controller's own pre-check.
    already_member = await db.scalar(
        select(TeamMember.id).where(
            TeamMember.project_id == project_id, TeamMember.user_id == request.user_id
        )
    )
    if already_member is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This user is already a member of this project.",
        )

    member = TeamMember(
        project_id=project_id,
        user_id=request.user_id,
        role_in_project=request.role_in_project,
    )
    db.add(member)
    await db.commit()

    result = await db.execute(
        select(TeamMember)
        .where(TeamMember.id == member.id)
        .options(selectinload(TeamMember.user))
    )
    member = result.scalar_one()

    return _to_response(member)


# PUT /api/projects/{project_id}/teammembers/{member_id} - Admin or ProjectManager only
@router.put("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def update_team_member(
    project_id: int,
    member_id: int,
    request: UpdateTeamMemberRequest,
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(require_roles("Admin", "ProjectManager")),
):
    result = await db.execute(
        select(TeamMember).where(TeamMember.id == member_id, TeamMember.project_id == project_id)
    )
    member = result.scalar_one_or_none()

    if member is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team member with id {member_id} not found in project {project_id}.",
        )

    member.role_in_project = request.role_in_project

    await db.commit()
    return None


# DELETE /api/projects/{project_id}/teammembers/{member_id} - Admin or ProjectManager only
@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_team_member(
    project_id: int,
    member_id: int,
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(require_roles("Admin", "ProjectManager")),
):
    result = await db.execute(
        select(TeamMember).where(TeamMember.id == member_id, TeamMember.project_id == project_id)
    )
    member = result.scalar_one_or_none()

    if member is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team member with id {member_id} not found in project {project_id}.",
        )

    await db.delete(member)
    await db.commit()
    return None