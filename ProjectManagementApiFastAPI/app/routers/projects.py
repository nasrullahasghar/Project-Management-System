from sqlalchemy import select
from app.database.models import Project
from sqlalchemy.orm import selectinload
from app.database.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.utils.datetime_utils import to_utc_naive
from fastapi import Depends , status , HTTPException ,APIRouter
from app.core.dependencies import get_current_user_claims , require_roles
from app.schemas.projects import ProjectResponse , CreateProjectRequest , UpdateProjectRequest


router = APIRouter(prefix="/api/projects", tags=["Projects"])


def _to_response(project:Project) -> ProjectResponse:
    return ProjectResponse(
        id = project.id,
        name = project.name,
        description = project.description,
        status = project.status,
        start_date = project.start_date,
        end_date = project.end_date,
        created_at = project.created_at,
        created_by_user_id = project.created_by_user_id,
        created_by_user_name = project.created_by_user.full_name,
        task_count = len(project.tasks),
        team_member_count = len(project.team_members)
    )

_WITH_RELATIONS = (
    selectinload(Project.created_by_user),
    selectinload(Project.tasks),
    selectinload(Project.team_members),
)

# <=============> GET ALL THE PROJECTS <=============>
@router.get("", response_model=list[ProjectResponse])
async def get_projects(
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(get_current_user_claims),
):
    result = await db.execute(select(Project).options(*_WITH_RELATIONS))
    projects = result.scalars().all()
    return [_to_response(p) for p in projects]


# <=============> GET PROJECT BY ID <=============>
@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(get_current_user_claims)):
        result = await db.execute(
            select(Project).where(Project.id == project_id).options(*_WITH_RELATIONS)
        )
        project = result.scalar_one_or_none()

        if project is None:
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail=f"The Project With ID {project_id} Not Found")
        return _to_response(project)


# <=============> CREATE PROJECT <=============>

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    request: CreateProjectRequest,
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(require_roles("Admin", "ProjectManager")),
):
    created_by_user_id = int(claims["sub"])

    project = Project(
        name=request.name,
        description=request.description,
        start_date=to_utc_naive(request.start_date),
        end_date=to_utc_naive(request.end_date),
        status="Planning",
        created_by_user_id=created_by_user_id,
    )
    db.add(project)
    await db.commit()

    result = await db.execute(
        select(Project).where(Project.id == project.id).options(*_WITH_RELATIONS)
    )
    project = result.scalar_one()

    return _to_response(project)

# <=============> UPDATE PROJECT <=============>

@router.put("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def update_project(
    project_id: int,
    request: UpdateProjectRequest,
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(require_roles("Admin", "ProjectManager")),
):
    project = await db.get(Project, project_id)

    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project with id {project_id} not found.")

    project.name = request.name
    project.description = request.description
    project.status = request.status
    project.start_date = to_utc_naive(request.start_date)
    project.end_date = to_utc_naive(request.end_date)

    await db.commit()
    return None


# <=============> DELETE PROJECT <=============>
@router.delete("/{project_id}",status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(require_roles("Admin","ProjectManager")),
):
    project = await db.get(Project,project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail=f"Project with id {project_id} not found.")
    await db.delete(project)
    await db.commit()
    return None