#!/usr/bin/env python3
"""
Quick test of the CREE hackathon MVP incident-based flow.

Tests:
  1. Backend module imports ✓
  2. Incident analysis ✓
  3. Scenario creation ✓
  4. Backwards compatibility ✓
"""

def test_imports():
    print("1. Testing backend imports...")
    try:
        from server.app import app
        from server.incidents import IncidentAnalyzer, create_scenario_from_incident
        from server.sessions import registry, ProjectSession
        from server.ws_handler import ws_manager
        print("   OK: All backend modules import successfully")
        return True
    except Exception as e:
        print(f"   FAIL: {e}")
        return False


def test_incident_analysis():
    print("\n2. Testing incident analysis...")
    try:
        from server.incidents import IncidentAnalyzer

        test_incident = """
        CRITICAL ALERT: Payment service degradation detected.
        API latency increased from avg 150ms to 2500ms.
        Error rate spike from 0.1% to 8%.
        Database CPU at 95%, memory at 92%.
        Multiple cascading failures detected across downstream services.
        """

        analysis = IncidentAnalyzer.analyze(test_incident)

        assert analysis['severity'] in ['low', 'medium', 'high', 'critical']
        assert 'extracted_signals' in analysis
        assert 'summary' in analysis

        print(f"   OK: Incident analyzed")
        print(f"      - Severity: {analysis['severity']}")
        print(f"      - Signals detected: {sum(1 for v in analysis['extracted_signals'].values() if v)}")
        print(f"      - Summary: {analysis['summary'][:60]}...")
        return True
    except Exception as e:
        print(f"   FAIL: {e}")
        return False


def test_scenario_creation():
    print("\n3. Testing scenario creation...")
    try:
        from server.incidents import IncidentAnalyzer, create_scenario_from_incident

        test_incident = "Latency spike to 3000ms and CPU at 98%"
        analysis = IncidentAnalyzer.analyze(test_incident)
        scenario = create_scenario_from_incident(analysis)

        assert 'task' in scenario
        assert 'initial_hidden' in scenario
        assert 'severity' in scenario

        print(f"   OK: Scenario created")
        print(f"      - Task: {scenario['task']}")
        print(f"      - Risk Level: {scenario['initial_hidden']['risk_level']:.1f}")
        print(f"      - Trigger Armed: {scenario['initial_hidden']['trigger_armed']}")
        return True
    except Exception as e:
        print(f"   FAIL: {e}")
        return False


def test_project_creation():
    print("\n4. Testing project creation from registry...")
    try:
        from server.sessions import registry

        # Create a project
        session_id = registry.create_project(task='recovery')
        project = registry.get_project(session_id)

        assert project is not None
        assert project.session_id == session_id
        assert project.current_task == 'recovery'

        # List projects
        projects = registry.list_projects()
        assert any(p.session_id == session_id for p in projects)

        print(f"   OK: Project created and retrieved")
        print(f"      - Session ID: {session_id}")
        print(f"      - Task: {project.current_task}")
        return True
    except Exception as e:
        print(f"   FAIL: {e}")
        return False


def test_backwards_compatibility():
    print("\n5. Testing backwards compatibility...")
    try:
        # The old API endpoints should still exist
        from server.app import app

        routes = [getattr(r, 'path', None) for r in app.routes]
        required_routes = ['/reset', '/step', '/state', '/actions', '/tasks', '/grade']

        found = [r for r in required_routes if any(r in route for route in routes if route)]

        print(f"   OK: Backwards compatibility routes present")
        for route in found[:3]:
            print(f"      - {route}")

        return len(found) >= len(required_routes)
    except Exception as e:
        print(f"   FAIL: {e}")
        return False


def test_incident_scenario_applies_on_reset():
    print("\n6. Testing incident scenario application on project reset...")
    try:
        from server.incidents import IncidentAnalyzer, create_scenario_from_incident
        from server.sessions import registry

        incident = "CRITICAL: cascading failures, latency 5000ms, CPU 97%, error spike"
        analysis = IncidentAnalyzer.analyze(incident)
        scenario = create_scenario_from_incident(analysis)

        session_id = registry.create_project(task=scenario['task'])
        project = registry.get_project(session_id)
        assert project is not None

        project.environment.scenario_config = scenario
        project.environment.reset(task_id=scenario['task'], scenario=scenario)

        hidden = project.environment.state.hidden
        assert hidden.risk_level == scenario['initial_hidden']['risk_level']
        assert hidden.trigger_armed == scenario['initial_hidden']['trigger_armed']
        assert hidden.system_mode == scenario['initial_hidden']['system_mode']

        print("   OK: Incident-derived scenario is applied to hidden state")
        print(f"      - Task: {scenario['task']}")
        print(f"      - Risk Level: {hidden.risk_level:.1f}")
        print(f"      - Trigger Armed: {hidden.trigger_armed}")
        return True
    except Exception as e:
        print(f"   FAIL: {e}")
        return False


def test_health_contract():
    print("\n7. Testing health endpoint contract...")
    try:
        from server.app import health

        response = health()
        assert response.get('status') == 'healthy'
        assert isinstance(response.get('version'), str)

        print("   OK: /health returns status and version")
        print(f"      - Version: {response['version']}")
        return True
    except Exception as e:
        print(f"   FAIL: {e}")
        return False


def main():
    print("=" * 60)
    print("CREE Hackathon MVP - Local Test Suite")
    print("=" * 60)

    tests = [
        test_imports,
        test_incident_analysis,
        test_scenario_creation,
        test_project_creation,
        test_backwards_compatibility,
        test_incident_scenario_applies_on_reset,
        test_health_contract,
    ]

    results = [test() for test in tests]

    print("\n" + "=" * 60)
    print(f"Tests Passed: {sum(results)}/{len(results)}")
    print("=" * 60)

    if all(results):
        print("\nAll tests passed! System is ready for local testing.")
        print("\nNext steps:")
        print("  1. Terminal 1: python -m uvicorn server.app:app --port 8000 --reload")
        print("  2. Terminal 2: cd frontend && npm start")
        print("  3. Open http://localhost:3000 in your browser")
        print("  4. Enter an incident report to test the flow")
        return 0
    else:
        print("\nSome tests failed. Check the errors above.")
        return 1


if __name__ == "__main__":
    exit(main())
