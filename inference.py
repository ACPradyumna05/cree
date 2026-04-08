"""
CREE Baseline Inference Script
================================
Runs an LLM agent against all 3 CREE tasks and emits validator-friendly logs.

Environment variables required:
    API_BASE_URL   - OpenAI-compatible API endpoint (e.g. https://api.openai.com/v1)
    MODEL_NAME     - Model identifier (e.g. gpt-4o-mini)
    OPENAI_API_KEY - API key
    HF_TOKEN       - (optional) Hugging Face token for HF-hosted models
    CREE_SERVER    - (optional) CREE server URL, default http://localhost:8000
"""

import os
import sys
import requests
from typing import Optional, List

from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Configuration from environment variables
# ---------------------------------------------------------------------------

API_BASE_URL = os.environ.get("API_BASE_URL", "https://api.openai.com/v1")
MODEL_NAME = os.environ.get("MODEL_NAME", "gpt-4o-mini")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
HF_TOKEN = os.environ.get("HF_TOKEN", "")
CREE_SERVER = os.environ.get("CREE_SERVER", "http://localhost:8000")
BENCHMARK = os.environ.get("BENCHMARK", "cree")

CLIENT_API_KEY = OPENAI_API_KEY or HF_TOKEN

if not CLIENT_API_KEY:
    print("ERROR: Set OPENAI_API_KEY (or HF_TOKEN for HF-hosted OpenAI-compatible endpoints).", file=sys.stderr)
    sys.exit(1)

client = OpenAI(api_key=CLIENT_API_KEY, base_url=API_BASE_URL)


# ---------------------------------------------------------------------------
# Environment wrapper
# ---------------------------------------------------------------------------

class CREEEnv:
    def __init__(self, server_url: str):
        self.url = server_url.rstrip("/")

    def reset(self, task: Optional[str] = None) -> dict:
        body = {"task": task} if task else {}
        r = requests.post(f"{self.url}/reset", json=body, timeout=10)
        r.raise_for_status()
        return r.json()["observation"]

    def step(self, action: str) -> dict:
        r = requests.post(f"{self.url}/step", json={"action": action}, timeout=10)
        r.raise_for_status()
        d = r.json()
        return {
            "observation": d["observation"],
            "reward": d["reward"],
            "done": d["done"],
        }

    def grade(self) -> dict:
        r = requests.post(f"{self.url}/grade", timeout=10)
        r.raise_for_status()
        return r.json()

    def list_actions(self) -> list:
        r = requests.get(f"{self.url}/actions", timeout=10)
        r.raise_for_status()
        return r.json()["actions"]

    def get_task(self, task_id: str) -> dict:
        r = requests.get(f"{self.url}/tasks", timeout=10)
        r.raise_for_status()
        tasks = {t["id"]: t for t in r.json()["tasks"]}
        return tasks.get(task_id, {})


# ---------------------------------------------------------------------------
# LLM agent
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are an expert Site Reliability Engineer (SRE) managing a production system.
At each step you observe the system's metrics and must choose exactly ONE action to take.

Your goal depends on the current task - read it carefully.

Respond with ONLY the action name - no explanation, no punctuation, just the action name.
If you are unsure, choose 'wait' or 'probe_latency'."""


def build_user_prompt(obs: dict, task_desc: str, actions: list, history: list, step: int, max_steps: int) -> str:
    action_list = "\n".join(f"  - {a['name']}: {a['description']}" for a in actions)
    history_str = ""
    if history:
        history_str = "\nLast 5 steps:\n" + "\n".join(
            f"  step {h['step']}: action={h['action']} -> "
            f"status={h['obs']['status']} lat={h['obs']['latency']:.0f}ms "
            f"err={h['obs']['error_rate']:.3f} reward={h['reward']:+.2f}"
            for h in history[-5:]
        )

    return f"""TASK ({step}/{max_steps}): {task_desc}

Current system state:
  status:     {obs['status']}
  latency:    {obs['latency']:.1f} ms
  error_rate: {obs['error_rate']:.4f}
  throughput: {obs['throughput']:.1f} rps
  cpu_load:   {obs['cpu_load']:.4f}
{history_str}

Available actions:
{action_list}

Choose exactly one action name:"""


def choose_action(obs: dict, task_desc: str, actions: list, history: list, step: int, max_steps: int, valid_names: list) -> str:
    prompt = build_user_prompt(obs, task_desc, actions, history, step, max_steps)
    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            max_tokens=20,
            temperature=0.0,
        )
        raw = (response.choices[0].message.content or "").strip().lower().replace("-", "_")
        for name in valid_names:
            if name in raw:
                return name
        return "wait"
    except Exception as exc:
        print(f"[DEBUG] LLM error: {exc} -> defaulting to 'wait'", file=sys.stderr)
        return "wait"


# ---------------------------------------------------------------------------
# Required stdout format
# ---------------------------------------------------------------------------

def log_start(task: str, env_name: str, model: str) -> None:
    print(f"[START] task={task} env={env_name} model={model}", flush=True)


def log_step(step: int, action: str, reward: float, done: bool, error: Optional[str]) -> None:
    print(
        f"[STEP] step={step} action={action} reward={reward:.2f} done={str(done).lower()} error={error if error else 'null'}",
        flush=True,
    )


def log_end(success: bool, steps: int, score: float, rewards: List[float]) -> None:
    rewards_str = ",".join(f"{r:.2f}" for r in rewards)
    print(
        f"[END] success={str(success).lower()} steps={steps} score={score:.4f} rewards={rewards_str}",
        flush=True,
    )


# ---------------------------------------------------------------------------
# Run one task episode
# ---------------------------------------------------------------------------

def run_task(env: CREEEnv, task_id: str) -> dict:
    task_meta = env.get_task(task_id)
    task_desc = task_meta.get("description", task_id)
    max_steps = task_meta.get("max_steps", 30)
    actions = env.list_actions()
    valid_names = [a["name"] for a in actions]

    obs = env.reset(task=task_id)
    history = []
    rewards: List[float] = []
    steps_taken = 0
    grade_result = {"score": 0.0}
    success = False

    log_start(task=task_id, env_name=BENCHMARK, model=MODEL_NAME)

    try:
        for step in range(1, max_steps + 1):
            action = choose_action(obs, task_desc, actions, history, step, max_steps, valid_names)

            step_error: Optional[str] = None
            reward = 0.0
            done = False

            try:
                result = env.step(action)
                reward = float(result.get("reward", 0.0))
                done = bool(result.get("done", False))
                obs = result["observation"]
                history.append(
                    {
                        "step": step,
                        "action": action,
                        "obs": obs,
                        "reward": reward,
                    }
                )
            except Exception as exc:
                step_error = str(exc)
                done = True

            rewards.append(reward)
            steps_taken = step
            log_step(step=step, action=action, reward=reward, done=done, error=step_error)

            if done:
                break

        grade_result = env.grade()
        score = float(grade_result.get("score", 0.0))
        score = min(max(score, 0.0), 1.0)
        success = score > 0.0

    except Exception as exc:
        print(f"[DEBUG] Task execution error for {task_id}: {exc}", file=sys.stderr)

    finally:
        score = float(grade_result.get("score", 0.0))
        score = min(max(score, 0.0), 1.0)
        log_end(success=success, steps=steps_taken, score=score, rewards=rewards)

    return grade_result


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    try:
        r = requests.get(f"{CREE_SERVER}/health", timeout=5)
        r.raise_for_status()
    except Exception as exc:
        print(f"ERROR: Cannot reach CREE server at {CREE_SERVER}: {exc}", file=sys.stderr)
        print("Start it with: uvicorn server.app:app --port 8000", file=sys.stderr)
        sys.exit(1)

    env = CREEEnv(CREE_SERVER)
    for task_id in ["stability", "recovery", "cascade_prevention"]:
        run_task(env, task_id)


if __name__ == "__main__":
    main()
