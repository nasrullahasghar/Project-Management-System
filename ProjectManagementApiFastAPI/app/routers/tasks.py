from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.database import get_db
from app.database.models import TaskItem, Project, User
from app.schemas.tasks import CreateTaskRequest, UpdateTaskRequest, TaskResponse
from app.core.dependencies import get_current_user_claims, require_roles
from app.utils.datetime_utils import to_utc_naive
from datetime import datetime, timezone

router = APIRouter(prefix="/api/projects/{project_id}/tasks", tags=["Tasks"])


async def _project_exists(db: AsyncSession, project_id: int) -> bool:
    result = await db.scalar(select(Project.id).where(Project.id == project_id))
    return result is not None


async def _user_exists(db: AsyncSession, user_id: int) -> bool:
    result = await db.scalar(select(User.id).where(User.id == user_id))
    return result is not None


def _to_response(task: TaskItem) -> TaskResponse:
    return TaskResponse(
        id=task.id,
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        due_date=task.due_date,
        created_at=task.created_at,
        project_id=task.project_id,
        assigned_to_user_id=task.assigned_to_user_id,
        assigned_to_user_name=task.assigned_to_user.full_name if task.assigned_to_user else None,
    )


# GET /api/projects/{project_id}/tasks - any authenticated user
@router.get("", response_model=list[TaskResponse])
async def get_tasks(
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
        select(TaskItem)
        .where(TaskItem.project_id == project_id)
        .options(selectinload(TaskItem.assigned_to_user))
    )
    tasks = result.scalars().all()
    return [_to_response(t) for t in tasks]


# GET /api/projects/{project_id}/tasks/{task_id} - any authenticated user
@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    project_id: int,
    task_id: int,
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(get_current_user_claims),
):
    result = await db.execute(
        select(TaskItem)
        .where(TaskItem.id == task_id, TaskItem.project_id == project_id)
        .options(selectinload(TaskItem.assigned_to_user))
    )
    task = result.scalar_one_or_none()

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with id {task_id} not found in project {project_id}.",
        )

    return _to_response(task)


# POST /api/projects/{project_id}/tasks - Admin or ProjectManager only
@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    project_id: int,
    request: CreateTaskRequest,
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(require_roles("Admin", "ProjectManager")),
):
    if not await _project_exists(db, project_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with id {project_id} not found.",
        )

    if request.assigned_to_user_id is not None:
        if not await _user_exists(db, request.assigned_to_user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with id {request.assigned_to_user_id} does not exist.",
            )

    task = TaskItem(
        title=request.title,
        description=request.description,
        priority=request.priority,
        due_date=to_utc_naive(request.due_date),
        status="ToDo",
        project_id=project_id,
        assigned_to_user_id=request.assigned_to_user_id,
    )
    db.add(task)
    await db.commit()

    result = await db.execute(
        select(TaskItem)
        .where(TaskItem.id == task.id)
        .options(selectinload(TaskItem.assigned_to_user))
    )
    task = result.scalar_one()

    return _to_response(task)


# PUT /api/projects/{project_id}/tasks/{task_id} - Admin or ProjectManager only
@router.put("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def update_task(
    project_id: int,
    task_id: int,
    request: UpdateTaskRequest,
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(require_roles("Admin", "ProjectManager")),
):
    result = await db.execute(
        select(TaskItem).where(TaskItem.id == task_id, TaskItem.project_id == project_id)
    )
    task = result.scalar_one_or_none()

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with id {task_id} not found in project {project_id}.",
        )

    if request.assigned_to_user_id is not None:
        if not await _user_exists(db, request.assigned_to_user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with id {request.assigned_to_user_id} does not exist.",
            )

    task.title = request.title
    task.description = request.description
    task.priority = request.priority
    task.due_date = to_utc_naive(request.due_date)
    task.assigned_to_user_id = request.assigned_to_user_id

    # CompletedAt stamping logic - direct port of the .NET controller's transition check
    if request.status == "Done" and task.status != "Done":
        task.completed_at = datetime.now(timezone.utc).replace(tzinfo=None)
    elif request.status != "Done" and task.status == "Done":
        task.completed_at = None

    task.status = request.status

    await db.commit()
    return None


# DELETE /api/projects/{project_id}/tasks/{task_id} - Admin or ProjectManager only
@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    project_id: int,
    task_id: int,
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(require_roles("Admin", "ProjectManager")),
):
    result = await db.execute(
        select(TaskItem).where(TaskItem.id == task_id, TaskItem.project_id == project_id)
    )
    task = result.scalar_one_or_none()

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with id {task_id} not found in project {project_id}.",
        )

    await db.delete(task)
    await db.commit()
    return None