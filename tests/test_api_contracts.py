from fastapi.testclient import TestClient

from server.app import app
from server.sessions import registry


client = TestClient(app)


def test_health_contract_returns_status_and_version():
    response = client.get("/health")
    assert response.status_code == 200

    payload = response.json()
    assert payload["status"] == "healthy"
    assert isinstance(payload.get("version"), str)


def test_required_runtime_routes_exist():
    routes = {getattr(route, "path", None) for route in app.routes}
    required = {
        "/reset",
        "/step",
        "/state",
        "/actions",
        "/tasks",
        "/grade",
        "/incidents/analyze",
    }
    assert required.issubset(routes)


def test_incident_analysis_creates_project_with_scenario_config():
    incident = (
        "CRITICAL: API latency reached 4200ms, error rate jumped to 12%, "
        "CPU is 96%, cascading failures are visible in downstream services."
    )
    response = client.post("/incidents/analyze", json={"incident_text": incident})
    assert response.status_code == 200

    payload = response.json()
    session_id = payload["session_id"]
    project = registry.get_project(session_id)

    assert project is not None
    assert project.environment.scenario_config is not None
    assert project.environment.scenario_config["severity"] in {"low", "medium", "high", "critical"}


def test_project_reset_applies_incident_scenario_hidden_state():
    incident = "CRITICAL cascading failure with 503 spikes, 95% CPU and severe latency"
    analyze_resp = client.post("/incidents/analyze", json={"incident_text": incident})
    assert analyze_resp.status_code == 200

    payload = analyze_resp.json()
    session_id = payload["session_id"]
    scenario = payload["scenario"]

    reset_resp = client.post(f"/projects/{session_id}/reset", json={"task": scenario["task"]})
    assert reset_resp.status_code == 200

    project = registry.get_project(session_id)
    hidden = project.environment.state.hidden
    assert hidden.risk_level == scenario["initial_hidden"]["risk_level"]
    assert hidden.trigger_armed == scenario["initial_hidden"]["trigger_armed"]
