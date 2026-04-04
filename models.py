from typing import Dict, Any, List

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Observable state - what the agent sees through the API
# ---------------------------------------------------------------------------

class Observation(BaseModel):
    latency: float      # response time in ms (10-500)
    error_rate: float   # fraction of failed requests (0-1)
    throughput: float   # requests per second (0-1000)
    cpu_load: float     # cpu utilization (0-1)
    status: str         # 'normal' | 'warning' | 'critical' | 'recovering'


class ObservableState(Observation):
    pass


# ---------------------------------------------------------------------------
# Hidden state - internal variables the agent cannot directly observe
# ---------------------------------------------------------------------------

class HiddenState(BaseModel):
    system_mode: str        # 'stable' | 'stressed' | 'cascade' | 'failing' | 'recovering'
    risk_level: float       # internal pressure 0-10
    memory_pressure: float  # memory saturation 0-10
    trigger_armed: bool     # armed by toggle_debug; makes inject_load catastrophic
    cascade_counter: int    # countdown to failure once cascade starts (0-5)
    recovery_steps: int     # steps remaining in post-failure recovery (0-3)
    consecutive_stress: int # number of consecutive stress actions (for memory bomb rule)
    last_actions: List[str] = Field(default_factory=list)  # last 3 actions taken


class EnvironmentState(BaseModel):
    observable: ObservableState
    hidden: HiddenState
    step_count: int = 0


# ---------------------------------------------------------------------------
# Actions - the interface between agent and environment
# ---------------------------------------------------------------------------

class Action(BaseModel):
    name: str
    description: str
    category: str   # 'probe' | 'stress' | 'control' | 'repair' | 'neutral'


ACTIONS: List[Action] = [
    Action(name='probe_latency', description='Lightweight latency probe; slight risk increase', category='probe'),
    Action(name='stress_cpu', description='CPU stress test; increases risk and memory pressure', category='stress'),
    Action(name='inject_load', description='High traffic injection; severe risk; triggers cascade if armed', category='stress'),
    Action(name='wait', description='Idle period; allows risk and memory to decay', category='neutral'),
    Action(name='reset_connections', description='Reset connection pool; helpful in stressed state, harmful in stable', category='control'),
    Action(name='force_gc', description='Force garbage collection; reduces memory but may cause GC pause', category='repair'),
    Action(name='probe_memory', description='Observe memory-related signals; neutral effect', category='probe'),
    Action(name='toggle_debug', description='Toggle debug mode; arms or disarms the cascade trigger', category='control'),
    Action(name='stabilize', description='Attempt risk reduction; only effective when risk < 6', category='repair'),
    Action(name='emergency_stop', description='Hard reset; zeroes risk/memory but kills throughput briefly', category='repair'),
]

ACTION_NAMES: List[str] = [a.name for a in ACTIONS]


# ---------------------------------------------------------------------------
# Step result - returned by /step
# ---------------------------------------------------------------------------

class Reward(BaseModel):
    value: float


class StepResult(BaseModel):
    state: ObservableState
    reward: float
    done: bool
    info: Dict[str, Any]