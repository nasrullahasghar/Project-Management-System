from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import String, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow() -> datetime:
    """
    Returns the current UTC time as a naive datetime (no tzinfo).

    The Postgres columns here are "timestamp without time zone" (created by
    EF Core), and asyncpg rejects tz-aware datetimes for those columns. We
    still compute the time using timezone.utc for correctness, then strip
    the tzinfo before returning - the Python-side equivalent of the ToUtc()
    normalization helper on the .NET backend.
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(Base):
    # EF Core created this table as "Users" (quoted, PascalCase) - we must
    # match table and column names exactly since both backends share the DB.
    __tablename__ = "Users"

    id: Mapped[int] = mapped_column("Id", primary_key=True)
    full_name: Mapped[str] = mapped_column("FullName", String, default="")
    email: Mapped[str] = mapped_column("Email", String, unique=True)
    password_hash: Mapped[str] = mapped_column("PasswordHash", String)
    role: Mapped[str] = mapped_column("Role", String, default="TeamMember")
    created_at: Mapped[datetime] = mapped_column("CreatedAt", default=utcnow)

    projects_created: Mapped[list["Project"]] = relationship(
        back_populates="created_by_user", foreign_keys="Project.created_by_user_id"
    )
    tasks_assigned: Mapped[list["TaskItem"]] = relationship(
        back_populates="assigned_to_user", foreign_keys="TaskItem.assigned_to_user_id"
    )
    team_memberships: Mapped[list["TeamMember"]] = relationship(back_populates="user")


class Project(Base):
    __tablename__ = "Projects"

    id: Mapped[int] = mapped_column("Id", primary_key=True)
    name: Mapped[str] = mapped_column("Name", String, default="")
    description: Mapped[Optional[str]] = mapped_column("Description", String, nullable=True)
    status: Mapped[str] = mapped_column("Status", String, default="Planning")
    start_date: Mapped[Optional[datetime]] = mapped_column("StartDate", nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column("EndDate", nullable=True)
    created_at: Mapped[datetime] = mapped_column("CreatedAt", default=utcnow)

    created_by_user_id: Mapped[int] = mapped_column("CreatedByUserId", ForeignKey("Users.Id"), nullable=False)
    created_by_user: Mapped["User"] = relationship(back_populates="projects_created", foreign_keys=[created_by_user_id])

    tasks: Mapped[list["TaskItem"]] = relationship(back_populates="project")
    team_members: Mapped[list["TeamMember"]] = relationship(back_populates="project")


class TaskItem(Base):
    # Named TaskItem (not Task) in .NET to avoid colliding with System.Threading.Tasks.Task.
    # No such collision risk in Python, but we keep the table name "Tasks" to match the existing DB.
    __tablename__ = "Tasks"

    id: Mapped[int] = mapped_column("Id", primary_key=True)
    title: Mapped[str] = mapped_column("Title", String, default="")
    description: Mapped[Optional[str]] = mapped_column("Description", String, nullable=True)
    status: Mapped[str] = mapped_column("Status", String, default="ToDo")
    priority: Mapped[str] = mapped_column("Priority", String, default="Medium")
    due_date: Mapped[Optional[datetime]] = mapped_column("DueDate", nullable=True)
    created_at: Mapped[datetime] = mapped_column("CreatedAt", default=utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column("CompletedAt", nullable=True)

    project_id: Mapped[int] = mapped_column("ProjectId", ForeignKey("Projects.Id"), nullable=False)
    project: Mapped["Project"] = relationship(back_populates="tasks")

    assigned_to_user_id: Mapped[Optional[int]] = mapped_column(
        "AssignedToUserId", ForeignKey("Users.Id", ondelete="SET NULL"), nullable=True
    )
    assigned_to_user: Mapped[Optional["User"]] = relationship(
        back_populates="tasks_assigned", foreign_keys=[assigned_to_user_id]
    )


class TeamMember(Base):
    __tablename__ = "TeamMembers"
    __table_args__ = (UniqueConstraint("ProjectId", "UserId", name="uq_teammember_project_user"),)

    id: Mapped[int] = mapped_column("Id", primary_key=True)
    role_in_project: Mapped[str] = mapped_column("RoleInProject", String, default="Contributor")
    joined_at: Mapped[datetime] = mapped_column("JoinedAt", default=utcnow)

    project_id: Mapped[int] = mapped_column("ProjectId", ForeignKey("Projects.Id"), nullable=False)
    project: Mapped["Project"] = relationship(back_populates="team_members")

    user_id: Mapped[int] = mapped_column("UserId", ForeignKey("Users.Id"), nullable=False)
    user: Mapped["User"] = relationship(back_populates="team_memberships")


class ActivityLog(Base):
    __tablename__ = "ActivityLogs"

    id: Mapped[int] = mapped_column("Id", primary_key=True)
    action: Mapped[str] = mapped_column("Action", String, default="")
    timestamp: Mapped[datetime] = mapped_column("Timestamp", default=utcnow)

    user_id: Mapped[int] = mapped_column("UserId", ForeignKey("Users.Id"), nullable=False)
    user: Mapped["User"] = relationship()

    project_id: Mapped[Optional[int]] = mapped_column(
        "ProjectId", ForeignKey("Projects.Id", ondelete="SET NULL"), nullable=True
    )
    project: Mapped[Optional["Project"]] = relationship()

    task_id: Mapped[Optional[int]] = mapped_column(
        "TaskId", ForeignKey("Tasks.Id", ondelete="SET NULL"), nullable=True
    )
    task: Mapped[Optional["TaskItem"]] = relationship()
