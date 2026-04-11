from env.environment import BlackBoxEnvironment


def make_env(task_id: str | None = None) -> BlackBoxEnvironment:
    env = BlackBoxEnvironment(seed=123)
    env.reset(task_id=task_id)
    return env


def test_cascade_prevention_task_starts_armed():
    env = make_env("cascade_prevention")
    assert env.state.hidden.trigger_armed is True


def test_inject_load_starts_countdown_when_trigger_armed():
    env = make_env("cascade_prevention")
    env.step("inject_load")
    assert env.state.hidden.cascade_counter == env.CASCADE_INIT - 1


def test_stabilize_is_ineffective_when_risk_above_threshold():
    env = make_env("stability")
    env.state.hidden.risk_level = 6.2

    env.step("stabilize")
    assert env.state.hidden.risk_level == 6.2


def test_force_gc_has_high_risk_penalty():
    env = make_env("stability")
    env.state.hidden.risk_level = 7.0
    env.state.hidden.memory_pressure = 6.0

    env.step("force_gc")
    assert env.state.hidden.memory_pressure == 3.0
    assert env.state.hidden.risk_level == 8.5


def test_scenario_override_applies_hidden_state_on_reset():
    env = make_env("stability")
    scenario = {
        "task": "recovery",
        "initial_hidden": {
            "system_mode": "stressed",
            "risk_level": 9.0,
            "memory_pressure": 4.0,
            "trigger_armed": True,
            "cascade_counter": 2,
            "recovery_steps": 0,
            "consecutive_stress": 0,
            "last_actions": [],
        },
    }

    env.reset(scenario=scenario)
    hidden = env.state.hidden

    assert hidden.system_mode == "stressed"
    assert hidden.risk_level == 9.0
    assert hidden.trigger_armed is True
