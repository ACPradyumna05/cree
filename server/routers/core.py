"""Core OpenEnv-compatible runtime endpoints."""

from typing import Any, Optional

from fastapi import APIRouter, Body, HTTPException, Request

from models import ACTIONS, ACTION_NAMES
from tasks.graders import TASKS, grade
from server.api_models import ResetRequest, StepRequest, obs_dict
from server.runtime import get_env

router = APIRouter()


@router.get("/")
def root() -> dict:
    return {
        "status": "ok",
        "message": "CREE server is running",
    }


@router.post("/reset")
def reset(request: ResetRequest = Body(default_factory=ResetRequest)) -> dict:
    env = get_env()
    obs = env.reset(task_id=request.task)
    return {
        "observation": obs_dict(obs),
        "state": obs_dict(obs),
        "task": request.task,
        "done": False,
        "message": "Environment reset" + (f" for task '{request.task}'" if request.task else ""),
    }


@router.post("/step")
def step(request: StepRequest) -> dict:
    env = get_env()
    try:
        result = env.step(request.action)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return {
        "observation": obs_dict(result.state),
        "state": obs_dict(result.state),
        "reward": result.reward,
        "done": result.done,
        "info": result.info,
    }


@router.get("/state")
def get_state() -> dict:
    env = get_env()
    if env.state is None:
        raise HTTPException(status_code=409, detail="Environment not initialised — call /reset first")

    obs = obs_dict(env.state.observable)
    return {
        "observation": obs,
        "state": obs,
    }


@router.get("/actions")
def list_actions() -> dict:
    return {
        "actions": [
            {"name": action.name, "description": action.description, "category": action.category}
            for action in ACTIONS
        ]
    }


@router.get("/tasks")
def list_tasks() -> dict:
    return {
        "tasks": [
            {
                "id": task["id"],
                "name": task["name"],
                "difficulty": task["difficulty"],
                "max_steps": task["max_steps"],
                "description": task["description"],
            }
            for task in TASKS.values()
        ]
    }


@router.post("/grade")
def grade_episode() -> dict:
    env = get_env()
    if env.current_task is None:
        raise HTTPException(status_code=400, detail="No active task. Call /reset with a task id first.")
    return grade(env.current_task, env.episode_metrics)


@router.get("/health")
def health(request: Request) -> dict:
    return {"status": "healthy", "version": request.app.version}


@router.get("/metadata")
def metadata() -> dict:
    return {
        "name": "cree",
        "description": (
            "CREE (Causal Reverse Engineering Engine) is an SRE incident-response "
            "environment with hidden causal dynamics."
        ),
    }


@router.get("/schema")
def schema() -> dict:
    observation_schema = {
        "type": "object",
        "properties": {
            "latency": {"type": "number"},
            "error_rate": {"type": "number"},
            "throughput": {"type": "number"},
            "cpu_load": {"type": "number"},
            "status": {"type": "string"},
        },
        "required": ["latency", "error_rate", "throughput", "cpu_load", "status"],
    }

    action_schema = {
        "type": "object",
        "properties": {
            "action": {
                "type": "string",
                "enum": ACTION_NAMES,
            }
        },
        "required": ["action"],
        "additionalProperties": False,
    }

    return {
        "action": action_schema,
        "observation": observation_schema,
        "state": observation_schema,
    }


@router.post("/mcp")
def mcp(payload: Optional[dict[str, Any]] = Body(default=None)) -> dict:
    req_id = payload.get("id") if isinstance(payload, dict) else None
    method = payload.get("method") if isinstance(payload, dict) else None
    return {
        "jsonrpc": "2.0",
        "id": req_id,
        "result": {
            "ok": True,
            "method": method,
            "service": "cree",
        },
    }
