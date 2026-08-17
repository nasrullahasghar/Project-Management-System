from typing import Optional
from datetime import datetime
from app.schemas.base import CamelModel


class TaskResponse(CamelModel):
    """Mirrors TaskDto.cs"""
    id: int
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    due_date: Optional[datetime] = None
    created_at: datetime
    project_id: int
    assigned_to_user_id: Optional[int] = None
    assigned_to_user_name: Optional[str] = None


class CreateTaskRequest(CamelModel):
    """Mirrors CreateTaskDto.cs. Status is not client-settable - the
    server always creates new tasks with status "ToDo"."""
    title: str
    description: Optional[str] = None
    priority: str = "Medium"
    due_date: Optional[datetime] = None
    assigned_to_user_id: Optional[int] = None


class UpdateTaskRequest(CamelModel):
    """Mirrors UpdateTaskDto.cs - full replace, including status (unlike create)."""
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    due_date: Optional[datetime] = None
    assigned_to_user_id: Optional[int] = None