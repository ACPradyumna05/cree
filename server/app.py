"""
CREE Environment Server — OpenEnv-compliant FastAPI with Multi-Project Support

Endpoints (Backwards Compatible)
---------
POST /reset          → reset env (optional body: {"task": "task_id"})
POST /step           → take one action → StepResult
GET  /state          → current observable state
GET  /actions        → list all valid actions + descriptions
GET  /tasks          → list all task definitions
POST /grade          → score current episode for the active task
GET  /health         → liveness probe

New Project-Scoped Endpoints
-----------------------------
POST   /projects              → Create new project
GET    /projects              → List all projects
GET    /projects/{id}         → Get project info
DELETE /projects/{id}         → Delete project
POST   /projects/{id}/reset   → Reset project environment
POST   /projects/{id}/step    → Step in project
GET    /projects/{id}/state   → Get project state
POST   /projects/{id}/grade   → Grade project episode
WS     /ws/{id}               → WebSocket metric stream
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Body, FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, field_validator
from typing import Any, Optional
import asyncio

from env.environment import BlackBoxEnvironment, TASK_CONFIGS
from tasks.graders import TASKS, grade
from models import ACTIONS, ACTION_NAMES
from server.sessions import registry, ProjectInfo
from server.ws_handler import ws_manager
from server.incidents import IncidentAnalyzer, create_scenario_from_incident

app = FastAPI(
    title="CREE — Causal Reverse Engineering Engine",
    description=(
        "OpenEnv-compliant SRE incident-response environment. "
        "Agent manages a production system with hidden internal state. "
        "Supports multi-project sessions with real-time WebSocket updates."
    ),
    version="2.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Legacy single environment (for backwards compatibility with demo.py)
env = BlackBoxEnvironment()


# ---------------------------------------------------------------------------
# Request schemas (Pydantic v2)
# ---------------------------------------------------------------------------

class ResetRequest(BaseModel):
    task: Optional[str] = None

    @field_validator('task')
    @classmethod
    def task_must_be_valid(cls, v):
        if v is not None and v not in TASK_CONFIGS:
            raise ValueError(f"Unknown task '{v}'. Valid: {list(TASK_CONFIGS)}")
        return v


class StepRequest(BaseModel):
    action: str

    @field_validator('action')
    @classmethod
    def action_must_be_valid(cls, v):
        from models import ACTION_NAMES
        if v not in ACTION_NAMES:
            raise ValueError(f"Unknown action '{v}'")
        return v


class IncidentRequest(BaseModel):
    incident_text: str

    @field_validator('incident_text')
    @classmethod
    def incident_not_empty(cls, v):
        if not v or len(v.strip()) < 10:
            raise ValueError("Incident text must be at least 10 characters")
        return v


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _obs_dict(obs) -> dict:
    return {
        "latency":    round(obs.latency, 2),
        "error_rate": round(obs.error_rate, 4),
        "throughput": round(obs.throughput, 2),
        "cpu_load":   round(obs.cpu_load, 4),
        "status":     obs.status,
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "CREE server is running"
    }

@app.post("/reset")
def reset(request: ResetRequest = ResetRequest()):
    obs = env.reset(task_id=request.task)
    return {
        "observation": _obs_dict(obs),
        "state":       _obs_dict(obs),   # alias for older clients
        "task":        request.task,
        "done":        False,
        "message":     f"Environment reset" + (f" for task '{request.task}'" if request.task else ""),
    }


@app.post("/step")
def step(request: StepRequest):
    try:
        result = env.step(request.action)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return {
        "observation": _obs_dict(result.state),
        "state":       _obs_dict(result.state),   # alias
        "reward":      result.reward,
        "done":        result.done,
        "info":        result.info,
    }


@app.get("/state")
def get_state():
    if env.state is None:
        raise HTTPException(status_code=409, detail="Environment not initialised — call /reset first")
    obs = _obs_dict(env.state.observable)
    return {
        "observation": obs,
        "state": obs
    }


@app.get("/actions")
def list_actions():
    return {
        "actions": [
            {"name": a.name, "description": a.description, "category": a.category}
            for a in ACTIONS
        ]
    }


@app.get("/tasks")
def list_tasks():
    return {
        "tasks": [
            {
                "id":          t["id"],
                "name":        t["name"],
                "difficulty":  t["difficulty"],
                "max_steps":   t["max_steps"],
                "description": t["description"],
            }
            for t in TASKS.values()
        ]
    }


@app.post("/grade")
def grade_episode():
    if env.current_task is None:
        raise HTTPException(
            status_code=400,
            detail="No active task. Call /reset with a task id first."
        )
    result = grade(env.current_task, env.episode_metrics)
    return result


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/metadata")
def metadata():
    return {
        "name": "cree",
        "description": (
            "CREE (Causal Reverse Engineering Engine) is an SRE incident-response "
            "environment with hidden causal dynamics."
        ),
    }


@app.get("/schema")
def schema():
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


@app.post("/mcp")
def mcp(payload: Optional[dict[str, Any]] = Body(default=None)):
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


# =========================================================================
# NEW: Project Management Endpoints
# =========================================================================

@app.post("/projects")
def create_project(request: Optional[ResetRequest] = None):
    """Create a new isolated project session."""
    task = request.task if request else None
    session_id = registry.create_project(task=task)
    project = registry.get_project(session_id)
    return {
        "session_id": session_id,
        "project": project.to_info().model_dump(mode='json'),
        "message": f"Project created successfully"
    }


@app.get("/projects")
def list_projects():
    """List all active project sessions."""
    projects = registry.list_projects()
    stats = registry.get_stats()
    return {
        "projects": [p.model_dump(mode='json') for p in projects],
        "stats": stats,
    }


@app.get("/projects/{session_id}")
def get_project(session_id: str):
    """Get information about a specific project."""
    project = registry.get_project(session_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{session_id}' not found")
    return {
        "session_id": session_id,
        "project": project.to_info().model_dump(mode='json'),
    }


@app.delete("/projects/{session_id}")
def delete_project(session_id: str):
    """Delete a project session."""
    if session_id == "default":
        raise HTTPException(status_code=403, detail="Cannot delete default project")

    deleted = registry.delete_project(session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Project '{session_id}' not found")

    return {"message": f"Project '{session_id}' deleted successfully"}


@app.post("/projects/{session_id}/reset")
async def project_reset(session_id: str, request: Optional[ResetRequest] = None):
    """Reset a project's environment."""
    project = registry.get_project(session_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{session_id}' not found")

    task = request.task if request else project.current_task
    obs = project.environment.reset(task_id=task)
    project.current_task = task
    project.reset_metrics()

    # Notify WebSocket subscribers
    await ws_manager.broadcast_control(session_id, "reset", {"task": task})

    return {
        "observation": _obs_dict(obs),
        "state": _obs_dict(obs),
        "task": task,
        "done": False,
        "message": f"Project reset" + (f" for task '{task}'" if task else ""),
    }


@app.post("/projects/{session_id}/step")
async def project_step(session_id: str, request: StepRequest):
    """Take a step in a project's environment."""
    project = registry.get_project(session_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{session_id}' not found")

    try:
        result = project.environment.step(request.action)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    project.steps_taken += 1
    project.total_reward += result.reward

    step_response = {
        "observation": _obs_dict(result.state),
        "state": _obs_dict(result.state),
        "reward": result.reward,
        "done": result.done,
        "info": result.info,
    }

    # Broadcast metrics to WebSocket subscribers
    await ws_manager.broadcast_metric(
        session_id,
        observation=_obs_dict(result.state),
        step_info={"action": request.action, "reward": result.reward, "done": result.done}
    )

    return step_response


@app.get("/projects/{session_id}/state")
def project_get_state(session_id: str):
    """Get current state of a project's environment."""
    project = registry.get_project(session_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{session_id}' not found")

    if project.environment.state is None:
        raise HTTPException(
            status_code=409,
            detail="Environment not initialised — call /projects/{session_id}/reset first"
        )

    obs = _obs_dict(project.environment.state.observable)
    return {
        "observation": obs,
        "state": obs,
    }


@app.post("/projects/{session_id}/grade")
def project_grade(session_id: str):
    """Grade the current episode for a project."""
    project = registry.get_project(session_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{session_id}' not found")

    if project.environment.current_task is None:
        raise HTTPException(
            status_code=400,
            detail="No active task. Call /projects/{session_id}/reset with a task id first."
        )

    result = grade(project.environment.current_task, project.environment.episode_metrics)
    return result


@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time metric streaming."""
    project = registry.get_project(session_id)
    if not project:
        await websocket.close(code=4004, reason=f"Project '{session_id}' not found")
        return

    await ws_manager.connect(session_id, websocket)
    try:
        while True:
            # Keep connection alive and listen for client messages
            data = await websocket.receive_text()
            # Future: handle client commands if needed
    except WebSocketDisconnect:
        await ws_manager.disconnect(session_id, websocket)
    except Exception as e:
        await ws_manager.disconnect(session_id, websocket)


# =========================================================================
# NEW: Incident Analysis Endpoints
# =========================================================================

@app.post("/incidents/analyze")
def analyze_incident(request: IncidentRequest):
    """
    Analyze a raw incident report and create a CREE scenario.

    Takes incident text, extracts signals, and returns a new project
    initialized with appropriate environment state.
    """
    # Analyze the incident
    analysis = IncidentAnalyzer.analyze(request.incident_text)

    # Create scenario from analysis
    scenario = create_scenario_from_incident(analysis)

    # Create a new project with the scenario
    session_id = registry.create_project(task=scenario['task'])
    project = registry.get_project(session_id)

    if not project:
        raise HTTPException(status_code=500, detail="Failed to create project")

    # Initialize environment with scenario parameters
    # (This will be called when user resets the environment)
    project.environment.scenario_config = scenario

    return {
        "session_id": session_id,
        "project": project.to_info().model_dump(mode='json'),
        "analysis": analysis,
        "scenario": scenario,
        "message": f"Incident analyzed. Created project {session_id} with severity: {scenario['severity']}"
    }


def main():
    import uvicorn
    uvicorn.run("server.app:app", host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()