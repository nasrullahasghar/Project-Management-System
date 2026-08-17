from datetime import datetime
from app.schemas.base import CamelModel


class TeamMemberResponse(CamelModel):
    """Mirrors TeamMemberDto.cs"""
    id: int
    role_in_project: str
    joined_at: datetime
    project_id: int
    user_id: int
    user_full_name: str
    user_email: str


class AddTeamMemberRequest(CamelModel):
    """Mirrors AddTeamMemberDto.cs"""
    user_id: int
    role_in_project: str = "Contributor"


class UpdateTeamMemberRequest(CamelModel):
    """Mirrors UpdateTeamMemberDto.cs"""
    role_in_project: str