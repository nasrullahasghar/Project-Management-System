from datetime import date
from pydantic import Field
from app.schemas.base import CamelModel


class StatusCountResponse(CamelModel):

    status: str
    count: int


class PriorityCountResponse(CamelModel):

    priority: str
    count: int


class ProjectProgressResponse(CamelModel):

    project_id: int
    project_name: str
    total_tasks: int
    completed_tasks: int
    percent_complete: float
    status_breakdown: list[StatusCountResponse]


class TaskCompletionPointResponse(CamelModel):

    date: date
    completed_count: int


class TaskCompletionReportResponse(CamelModel):

    from_date: date = Field(alias="from")
    to: date
    data_points: list[TaskCompletionPointResponse]


class MemberPerformanceResponse(CamelModel):

    user_id: int
    user_name: str
    assigned_count: int
    completed_count: int
    overdue_count: int


class TeamPerformanceReportResponse(CamelModel):

    project_id: int
    members: list[MemberPerformanceResponse]


class GlobalBreakdownResponse(CamelModel):

    by_status: list[StatusCountResponse]
    by_priority: list[PriorityCountResponse]