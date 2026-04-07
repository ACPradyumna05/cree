"""
Project Session Management — Multi-project environment isolation.

Manages multiple BlackBoxEnvironment instances per project/session.
Each session is isolated and maintains separate state.
"""

import uuid
from datetime import datetime, timedelta
from typing import Dict, Optional, List
from pydantic import BaseModel

from env.environment import BlackBoxEnvironment


# ---------------------------------------------------------------------------
# Schema Models
# ---------------------------------------------------------------------------

class ProjectInfo(BaseModel):
    """Metadata about a project session."""
    session_id: str
    current_task: Optional[str] = None
    created_at: datetime
    last_accessed: datetime
    status: str = "active"  # active, completed, failed
    steps_taken: int = 0
    total_reward: float = 0.0

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


# ---------------------------------------------------------------------------
# ProjectSession — Wraps an environment with metadata
# ---------------------------------------------------------------------------

class ProjectSession:
    """A single isolated project with its own environment."""

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.environment = BlackBoxEnvironment()
        self.current_task: Optional[str] = None
        self.created_at = datetime.now()
        self.last_accessed = datetime.now()
        self.status = "active"
        self.steps_taken = 0
        self.total_reward = 0.0

    def update_access_time(self):
        """Mark this session as accessed (for auto-cleanup)."""
        self.last_accessed = datetime.now()

    def to_info(self) -> ProjectInfo:
        """Convert to ProjectInfo response model."""
        return ProjectInfo(
            session_id=self.session_id,
            current_task=self.current_task,
            created_at=self.created_at,
            last_accessed=self.last_accessed,
            status=self.status,
            steps_taken=self.steps_taken,
            total_reward=self.total_reward,
        )

    def reset_metrics(self):
        """Reset episode metrics."""
        self.steps_taken = 0
        self.total_reward = 0.0


# ---------------------------------------------------------------------------
# ProjectRegistry — Manages all sessions
# ---------------------------------------------------------------------------

class ProjectRegistry:
    """Central registry for managing multiple project sessions."""

    def __init__(self, auto_cleanup_hours: int = 24):
        self.projects: Dict[str, ProjectSession] = {}
        self.auto_cleanup_hours = auto_cleanup_hours
        # Special "default" project for backwards compatibility
        self.default_session_id = "default"
        self._ensure_default_project()

    def _ensure_default_project(self):
        """Create the default project for backwards compat."""
        if self.default_session_id not in self.projects:
            self.projects[self.default_session_id] = ProjectSession(self.default_session_id)

    def create_project(self, task: Optional[str] = None) -> str:
        """
        Create a new project session.

        Args:
            task: Optional task to initialize with

        Returns:
            session_id (UUID string)
        """
        session_id = str(uuid.uuid4())[:8]  # Shortened UUID for readability
        project = ProjectSession(session_id)
        project.current_task = task
        self.projects[session_id] = project
        return session_id

    def get_project(self, session_id: str) -> Optional[ProjectSession]:
        """Get a project by session_id. Returns None if not found."""
        project = self.projects.get(session_id)
        if project:
            project.update_access_time()
        return project

    def get_project_or_default(self, session_id: Optional[str] = None) -> ProjectSession:
        """
        Get a project or fall back to default.
        Used for backwards compatibility with old API.
        """
        if session_id is None or session_id == "default":
            return self.projects[self.default_session_id]

        project = self.get_project(session_id)
        if not project:
            raise ValueError(f"Project '{session_id}' not found")
        return project

    def list_projects(self) -> List[ProjectInfo]:
        """Get info for all active projects."""
        self.cleanup_old_projects()  # Clean before returning
        return [p.to_info() for p in self.projects.values()]

    def delete_project(self, session_id: str) -> bool:
        """
        Delete a project session.

        Args:
            session_id: Session to delete

        Returns:
            True if deleted, False if not found
        """
        if session_id == self.default_session_id:
            # Don't allow deletion of default project
            return False

        if session_id in self.projects:
            del self.projects[session_id]
            return True
        return False

    def cleanup_old_projects(self):
        """Remove inactive projects based on auto_cleanup_hours."""
        threshold = datetime.now() - timedelta(hours=self.auto_cleanup_hours)
        to_delete = [
            sid for sid, proj in self.projects.items()
            if sid != self.default_session_id and proj.last_accessed < threshold
        ]
        for sid in to_delete:
            del self.projects[sid]

    def get_stats(self) -> dict:
        """Get registry statistics."""
        return {
            "total_projects": len(self.projects),
            "active_projects": sum(1 for p in self.projects.values() if p.status == "active"),
            "total_steps_across_all": sum(p.steps_taken for p in self.projects.values()),
            "total_reward_across_all": sum(p.total_reward for p in self.projects.values()),
        }


# Global registry instance
registry = ProjectRegistry()
