---
title: CREE Hackathon MVP
sdk: docker
app_port: 8000
---

# CREE: Causal Reverse Engineering Engine

Most AI agents can optimize reward. Very few can infer hidden cause and effect.

CREE is an interactive benchmark and training environment that measures causal understanding under partial observability, delayed effects, and sequence-sensitive failures.

## If You Read One Paragraph

Current AI evaluations often reward shortcut behavior that looks good in metrics but fails under hidden dependencies. CREE simulates those hidden dependencies and asks one practical question: can an agent (or human operator) diagnose and recover systems by understanding causality, not just by chasing immediate reward?

## 30-Second Overview

Problem: standard evals reward shortcuts, not real reasoning under uncertainty.

What CREE does:
- converts plain-text incidents into interactive system scenarios
- hides true internal dynamics while exposing realistic metrics
- forces agents (or humans) to discover latent rules step-by-step
- grades outcomes on stability, recovery quality, and cascade prevention

Why this matters:
- stronger signal for trustworthy agent behavior
- practical relevance for incident response training and reliability teams

## Who Needs This Right Now

- AI evaluation teams that need better failure-mode testing before deployment
- reliability/SRE teams that want realistic incident-response drills
- hackathon judges who want to see practical impact, not just a research toy

## What You Actually Do In The App

You have three ways to run CREE:

1. Manual exploration (dashboard):
- Select a task
- Reset episode
- Click actions and observe metric changes
- Grade the episode

2. LLM benchmark (terminal):
- Run `python inference.py`
- Requires OpenAI-compatible API credentials
- Used to evaluate external models, not required for website usage

## Live Links

- Hugging Face Space: https://kr4ter-cree-sre.hf.space
- OpenEnv validation command:

```bash
openenv validate https://kr4ter-cree-sre.hf.space
```

## Demo Media

- Landing Page MP4 (showcase): [Watch video](media/frontpage.mp4)
- Grading Result JPG: [View image](media/grading.jpeg)
- Dashboard Showcase GIF: ![Dashboard Showcase](media/dashboard.gif)
- Proper Runthrough Video: [Watch video](media/working.mp4)

## What Judges Should Notice

- Novelty: hidden causal rules and delayed effects, not shallow reactive control.
- Technical depth: partially observable environment with non-linear transitions.
- Utility: incident-response rehearsal with objective grading.
- Product quality: live dashboard, project isolation, and reproducible flows.
- Scalability: rule packs and scenario presets can extend to new domains.

## How It Works

1. Submit incident text through dashboard or API.
2. Analyzer extracts system signals (latency, errors, throughput, CPU, cascade hints).
3. Scenario generator initializes hidden state and selects a task profile.
4. Agent/operator interacts through actions and observed metrics.
5. Grader scores performance in the strict range (0, 1).

## Core Innovation

The environment is deliberately deceptive in realistic ways:
- delayed effects: actions can fail later, not immediately
- sequence traps: the same action is good or harmful depending on order/context
- hidden dependencies: trigger states and counters are latent
- observable consequences: outcomes are measurable and traceable

This makes CREE useful as both:
- a benchmark for causal competence in AI agents
- a practical SRE training playground

## Feature Highlights

- FastAPI backend with OpenEnv-compatible API contract
- React + TypeScript dashboard for live interaction
- Real-time metrics via WebSocket
- Multi-project session isolation
- Incident-to-scenario pipeline
- Three benchmark tasks with dedicated graders
- Baseline inference runner for agentic evaluation
- Docker + Hugging Face Spaces deployment

## 60-Second Demo 

1. Paste a critical incident report.
2. Show extracted signals and generated scenario severity.
3. Reset into scenario and take 4-6 actions.
4. Narrate one wrong sequence and one corrective sequence.
5. Show final grade and explain why the score changed.
6. Close with practical use case: "this tests causal understanding, not just reward chasing."

## OpenEnv Compliance

This project implements and serves the required validator endpoints:
- GET /openapi.json
- GET /health
- GET /metadata
- GET /schema
- POST /mcp
- POST /reset
- POST /step
- GET /state

The deployed Space validates required endpoint checks successfully.

## Core API Surface

### Required runtime endpoints

- POST /reset
- POST /step
- GET /state

### Environment and grading

- GET /actions
- GET /tasks
- POST /grade

### Incident pipeline

- POST /incidents/analyze

### Project-scoped sessions

- POST /projects
- GET /projects
- GET /projects/{session_id}
- DELETE /projects/{session_id}
- POST /projects/{session_id}/reset
- POST /projects/{session_id}/step
- GET /projects/{session_id}/state
- POST /projects/{session_id}/grade
- WS /ws/{session_id}

## Task and Grading Design

Included tasks:
- stability
- recovery
- cascade_prevention

Scoring:
- POST /grade returns numeric score in [0.0, 1.0]
- per-task graders evaluate survival, recovery quality, and failure penalties

## Architecture Snapshot

```text
Frontend (React TS)
	-> Incident input, controls, metrics, history
	-> API + WebSocket client

Backend (FastAPI)
	-> Session/project orchestration
	-> Incident analysis + scenario creation
	-> Step/reset/state/grade endpoints

Environment Engine
	-> Hidden state transitions
	-> Delayed and sequence-sensitive causal rules
	-> Observable metric projection

Task Graders
	-> stability, recovery, cascade_prevention
```

## Local Setup

### Option A: Docker Compose

```bash
docker-compose up --build
```

- Backend: http://localhost:8000
- Frontend: http://localhost:3000

### Option B: Manual

Backend:

```bash
python -m venv venv
# Windows PowerShell
.\\venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
python -m uvicorn server.app:app --port 8000 --reload
```

Frontend:

```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

## Optional LLM Benchmark (Terminal)

The benchmark script is at repository root:
- inference.py

Run:

```bash
python inference.py
```

Environment variables:

```bash
API_BASE_URL=https://api.openai.com/v1
MODEL_NAME=gpt-4o-mini
OPENAI_API_KEY=...
HF_TOKEN=...
CREE_SERVER=http://localhost:8000
```

Notes:
- configure either OPENAI_API_KEY or HF_TOKEN based on provider
- keep secrets out of git; use local env and Space secrets
- this mode is optional and separate from dashboard usage

## Testing

```bash
python -m pytest -q
python test_mvp.py
python scripts/preflight.py
```

`preflight.py` runs compile checks, pytest, and smoke tests in one command.

## Deployment to Hugging Face Spaces

1. Push latest code to GitHub.
2. Create a Docker Space.
3. Connect the repository.
4. Set Space secrets and variables:
	- API_BASE_URL
	- MODEL_NAME
	- HF_TOKEN and/or OPENAI_API_KEY
5. Redeploy and validate.

## Repository Layout

```text
cree/
|- server/                 # FastAPI routes, sessions, websocket, incident analysis
|- env/                    # Black-box environment dynamics
|- tasks/                  # Task definitions and graders
|- frontend/               # React TypeScript dashboard
|- media/                  # Demo assets
|- inference.py            # Baseline inference runner
|- openenv.yaml            # OpenEnv configuration
|- Dockerfile              # Backend container image
|- docker-compose.yml      # Local full-stack run
|- test_mvp.py             # Smoke tests
|- scripts/preflight.py    # One-command local quality gate
|- .github/workflows/      # CI checks
```

## Judging Alignment Summary

- Problem clarity: addresses false confidence in current agent evals.
- Uniqueness: causal discovery under hidden dynamics.
- Practicality: incident response simulation and grading.
- Technical depth: non-linear environment and task-specific scoring.
- Demo quality: interactive dashboard with real-time metrics.
- Future potential: extensible rule packs, scenarios, and benchmarks.

## Future Scope

- Rule discovery timeline visualization
- Counterfactual replay mode ("what if action N changed")
- Exportable episode traces for benchmark comparisons
- Domain-specific scenario packs (payments, infra, customer support)

## Security

- .env is ignored by git
- use .env.example as template
- rotate leaked keys immediately
- store production secrets only in provider secret managers

## License

MIT
