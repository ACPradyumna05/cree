import pytest

from tasks.graders import grade


def test_grader_scores_stay_in_strict_open_interval():
    low = grade("stability", {"total_steps": 0, "steps_in_normal": 0, "failures": 12})["score"]
    high = grade(
        "cascade_prevention",
        {"total_steps": 999, "failures": 0, "trigger_disarmed_while_armed": True},
    )["score"]

    assert 0.0 < low < 1.0
    assert 0.0 < high < 1.0


def test_unknown_task_raises_value_error():
    with pytest.raises(ValueError):
        grade("unknown_task", {"total_steps": 1})
