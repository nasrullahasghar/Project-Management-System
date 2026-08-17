from typing import Optional
from datetime import datetime
from app.schemas.base import CamelModel


class ProjectResponse(CamelModel):
    id: int
    name: str
    description: Optional[str] = None
    status: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime
    created_by_user_id: int
    created_by_user_name: str
    task_count: int
    team_member_count: int


class CreateProjectRequest(CamelModel):
    name: str
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class UpdateProjectRequest(CamelModel):
    name: str
    description: Optional[str] = None
    status: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None