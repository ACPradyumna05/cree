"""Project-scoped session and websocket endpoints."""

from typing import Optional

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect

from server.api_models import ResetRequest, StepRequest, obs_dict
from server.sessions import registry
from server.ws_handler import ws_manager
from tasks.graders import grade

router = APIRouter()


@router.post("/projects")
def create_project(request: Optional[ResetRequest] = None) -> dict:
    task = request.task if request else None
    session_id = registry.create_project(task=task)
    project = registry.get_project(session_id)
    return {
        "session_id": session_id,
        "project": project.to_info().model_dump(mode="json"),
        "message": "Project created successfully",
    }


@router.get("/projects")
def list_projects() -> dict:
    projects = registry.list_projects()
    stats = registry.get_stats()
    return {
        "projects": [project.model_dump(mode="json") for project in projects],
        "stats": stats,
    }


@router.get("/projects/{session_id}")
def get_project(session_id: str) -> dict:
    project = registry.get_project(session_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{session_id}' not found")
    return {
        "session_id": session_id,
        "project": project.to_info().model_dump(mode="json"),
    }


@router.delete("/projects/{session_id}")
def delete_project(session_id: str) -> dict:
    if session_id == "default":
        raise HTTPException(status_code=403, detail="Cannot delete default project")

    deleted = registry.delete_project(session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Project '{session_id}' not found")

    return {"message": f"Project '{session_id}' deleted successfully"}


@router.post("/projects/{session_id}/reset")
async def project_reset(session_id: str, request: Optional[ResetRequest] = None) -> dict:
    project = registry.get_project(session_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{session_id}' not found")

    task = request.task if request else project.current_task
    scenario = project.environment.scenario_config
    if scenario and task and scenario.get("task") != task:
        scenario = None

    obs = project.environment.reset(task_id=task, scenario=scenario)
    project.current_task = task
    project.reset_metrics()

    await ws_manager.broadcast_control(session_id, "reset", {"task": task})

    return {
        "observation": obs_dict(obs),
        "state": obs_dict(obs),
        "task": task,
        "done": False,
        "message": "Project reset" + (f" for task '{task}'" if task else ""),
    }


@router.post("/projects/{session_id}/step")
async def project_step(session_id: str, request: StepRequest) -> dict:
    project = registry.get_project(session_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{session_id}' not found")

    try:
        result = project.environment.step(request.action)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    project.steps_taken += 1
    project.total_reward += result.reward

    response = {
        "observation": obs_dict(result.state),
        "state": obs_dict(result.state),
        "reward": result.reward,
        "done": result.done,
        "info": result.info,
    }

    await ws_manager.broadcast_metric(
        session_id,
        observation=obs_dict(result.state),
        step_info={"action": request.action, "reward": result.reward, "done": result.done},
    )

    return response


@router.get("/projects/{session_id}/state")
def project_get_state(session_id: str) -> dict:
    project = registry.get_project(session_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{session_id}' not found")

    if project.environment.state is None:
        raise HTTPException(
            status_code=409,
            detail="Environment not initialised — call /projects/{session_id}/reset first",
        )

    obs = obs_dict(project.environment.state.observable)
    return {
        "observation": obs,
        "state": obs,
    }


@router.post("/projects/{session_id}/grade")
def project_grade(session_id: str) -> dict:
    project = registry.get_project(session_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{session_id}' not found")

    if project.environment.current_task is None:
        raise HTTPException(
            status_code=400,
            detail="No active task. Call /projects/{session_id}/reset with a task id first.",
        )

    return grade(project.environment.current_task, project.environment.episode_metrics)


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    project = registry.get_project(session_id)
    if not project:
        await websocket.close(code=4004, reason=f"Project '{session_id}' not found")
        return

    await ws_manager.connect(session_id, websocket)
    try:
        while True:
            _ = await websocket.receive_text()
    except WebSocketDisconnect:
        await ws_manager.disconnect(session_id, websocket)
    except Exception:
        await ws_manager.disconnect(session_id, websocket)
