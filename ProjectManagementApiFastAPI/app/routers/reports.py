from datetime import date, datetime, time, timedelta, timezone
from typing import Optional
from collections import Counter

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.database import get_db
from app.database.models import Project, TaskItem, TeamMember
from app.core.dependencies import get_current_user_claims
from app.schemas.reports import (
    StatusCountResponse,
    PriorityCountResponse,
    ProjectProgressResponse,
    TaskCompletionPointResponse,
    TaskCompletionReportResponse,
    MemberPerformanceResponse,
    TeamPerformanceReportResponse,
    GlobalBreakdownResponse,
)

router = APIRouter(prefix="/api/reports", tags=["Reports"])


# GET /api/reports/projects/{project_id}/progress
@router.get("/projects/{project_id}/progress", response_model=ProjectProgressResponse)
async def get_project_progress(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(get_current_user_claims),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id).options(selectinload(Project.tasks))
    )
    project = result.scalar_one_or_none()

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with id {project_id} not found.",
        )

    tasks = project.tasks
    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.status == "Done")

    status_counts = Counter(t.status for t in tasks)
    status_breakdown = [
        StatusCountResponse(status=s, count=c) for s, c in status_counts.items()
    ]

    percent_complete = 0.0 if total_tasks == 0 else round(completed_tasks / total_tasks * 100, 1)

    return ProjectProgressResponse(
        project_id=project.id,
        project_name=project.name,
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        percent_complete=percent_complete,
        status_breakdown=status_breakdown,
    )


# GET /api/reports/task-completion?projectId={optional}&from={date}&to={date}
@router.get("/task-completion", response_model=TaskCompletionReportResponse)
async def get_task_completion(
    project_id: Optional[int] = Query(default=None, alias="projectId"),
    from_: Optional[date] = Query(default=None, alias="from"),
    to: Optional[date] = Query(default=None, alias="to"),
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(get_current_user_claims),
):
    # Default to the last 30 days if no range is given
    to_date = to if to is not None else datetime.now(timezone.utc).date()
    from_date = from_ if from_ is not None else to_date - timedelta(days=30)

    if from_date > to_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="'from' date must be before 'to' date.",
        )

    # completed_at is stored as a naive UTC datetime, so the range boundaries
    # must also be naive for the comparison to work against that column.
    from_datetime = datetime.combine(from_date, time.min)
    to_datetime = datetime.combine(to_date, time.max)

    query = select(TaskItem).where(
        TaskItem.status == "Done",
        TaskItem.completed_at.is_not(None),
        TaskItem.completed_at >= from_datetime,
        TaskItem.completed_at <= to_datetime,
    )
    if project_id is not None:
        query = query.where(TaskItem.project_id == project_id)

    result = await db.execute(query)
    completed_tasks = result.scalars().all()

    # Group completions by calendar day
    grouped: dict[date, int] = Counter(t.completed_at.date() for t in completed_tasks)

    # Build every day in the range so the chart has no gaps, filling in 0 where nothing completed
    data_points = []
    day = from_date
    while day <= to_date:
        data_points.append(
            TaskCompletionPointResponse(date=day, completed_count=grouped.get(day, 0))
        )
        day += timedelta(days=1)

    return TaskCompletionReportResponse(
        from_date=from_date,
        to=to_date,
        data_points=data_points,
    )


# GET /api/reports/projects/{project_id}/team-performance
@router.get("/projects/{project_id}/team-performance", response_model=TeamPerformanceReportResponse)
async def get_team_performance(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(get_current_user_claims),
):
    project_exists = await db.scalar(select(Project.id).where(Project.id == project_id))
    if project_exists is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with id {project_id} not found.",
        )

    tm_result = await db.execute(
        select(TeamMember)
        .where(TeamMember.project_id == project_id)
        .options(selectinload(TeamMember.user))
    )
    team_members = tm_result.scalars().all()

    task_result = await db.execute(select(TaskItem).where(TaskItem.project_id == project_id))
    tasks = task_result.scalars().all()

    now = datetime.now(timezone.utc).replace(tzinfo=None)

    members = []
    for tm in team_members:
        member_tasks = [t for t in tasks if t.assigned_to_user_id == tm.user_id]
        members.append(
            MemberPerformanceResponse(
                user_id=tm.user_id,
                user_name=tm.user.full_name,
                assigned_count=len(member_tasks),
                completed_count=sum(1 for t in member_tasks if t.status == "Done"),
                overdue_count=sum(
                    1 for t in member_tasks
                    if t.status != "Done" and t.due_date is not None and t.due_date < now
                ),
            )
        )

    return TeamPerformanceReportResponse(project_id=project_id, members=members)


# GET /api/reports/global-breakdown
@router.get("/global-breakdown", response_model=GlobalBreakdownResponse)
async def get_global_breakdown(
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(get_current_user_claims),
):
    result = await db.execute(select(TaskItem))
    tasks = result.scalars().all()

    status_counts = Counter(t.status for t in tasks)
    priority_counts = Counter(t.priority for t in tasks)

    return GlobalBreakdownResponse(
        by_status=[StatusCountResponse(status=s, count=c) for s, c in status_counts.items()],
        by_priority=[PriorityCountResponse(priority=p, count=c) for p, c in priority_counts.items()],
    )