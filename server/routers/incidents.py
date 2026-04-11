"""Incident analysis endpoints."""

from fastapi import APIRouter, HTTPException

from server.api_models import IncidentRequest
from server.incidents import IncidentAnalyzer, create_scenario_from_incident
from server.sessions import registry

router = APIRouter()


@router.post("/incidents/analyze")
def analyze_incident(request: IncidentRequest) -> dict:
    analysis = IncidentAnalyzer.analyze(request.incident_text)
    scenario = create_scenario_from_incident(analysis)

    session_id = registry.create_project(task=scenario["task"])
    project = registry.get_project(session_id)
    if not project:
        raise HTTPException(status_code=500, detail="Failed to create project")

    project.environment.scenario_config = scenario

    return {
        "session_id": session_id,
        "project": project.to_info().model_dump(mode="json"),
        "analysis": analysis,
        "scenario": scenario,
        "message": f"Incident analyzed. Created project {session_id} with severity: {scenario['severity']}",
    }
