"""Shared request models and API helpers for routers."""

from typing import Optional

from pydantic import BaseModel, field_validator

from env.environment import TASK_CONFIGS
from models import ACTION_NAMES


class ResetRequest(BaseModel):
    task: Optional[str] = None

    @field_validator("task")
    @classmethod
    def task_must_be_valid(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value not in TASK_CONFIGS:
            raise ValueError(f"Unknown task '{value}'. Valid: {list(TASK_CONFIGS)}")
        return value


class StepRequest(BaseModel):
    action: str

    @field_validator("action")
    @classmethod
    def action_must_be_valid(cls, value: str) -> str:
        if value not in ACTION_NAMES:
            raise ValueError(f"Unknown action '{value}'")
        return value


class IncidentRequest(BaseModel):
    incident_text: str

    @field_validator("incident_text")
    @classmethod
    def incident_not_empty(cls, value: str) -> str:
        if not value or len(value.strip()) < 10:
            raise ValueError("Incident text must be at least 10 characters")
        return value


def obs_dict(obs) -> dict:
    return {
        "latency": round(obs.latency, 2),
        "error_rate": round(obs.error_rate, 4),
        "throughput": round(obs.throughput, 2),
        "cpu_load": round(obs.cpu_load, 4),
        "status": obs.status,
    }
