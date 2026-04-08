---
title: CREE Hackathon MVP
sdk: docker
app_port: 8000
---

# CREE: Causal Reverse Engineering Engine

Train incident response skills on realistic, interactive scenarios generated from real incident text.

CREE turns incident reports into a live SRE playground where users can investigate, act, and get graded.

## Live Links

- Hugging Face Space: https://kr4ter-cree-sre.hf.space
- OpenEnv validation command:

```bash
openenv validate https://kr4ter-cree-sre.hf.space
```

## Media Showcase

- Landing Page MP4 (showcase): [Watch video](media/frontpage.mp4)
- Grading Result JPG: [View image](media/grading.jpeg)
- Dashboard Showcase GIF: ![Dashboard Showcase](media/dashboard.gif)
- Proper Runthrough Video: [Watch video](media/working.mp4)

## Problem and Solution

Most incident training is static and post-factum. Teams read postmortems but do not practice decision-making under pressure.

CREE solves this by:
- converting plain incident text into scenario state
- exposing only observable system metrics
- keeping root-cause dynamics hidden
- grading performance over structured tasks

## How CREE Works

1. Submit incident text through the incident endpoint or dashboard.
2. Analyzer extracts signals such as latency spike, error growth, CPU pressure, throughput drop, and cascade indicators.
3. Scenario generator maps these signals to an initialized environment state.
4. User takes actions step by step while observing metrics in real time.
5. Grader scores task outcome in the range [0.0, 1.0].

## Feature Highlights

- FastAPI backend with OpenEnv-compatible contract
- React + TypeScript dashboard
- Real-time metric streaming via WebSocket
- Multi-project session isolation
- Three benchmark tasks with dedicated graders
- Baseline inference script for agentic evaluation
- Docker and Hugging Face Spaces deployment

## OpenEnv Compliance Status

This project implements and serves the required validator endpoints:
- GET /openapi.json
- GET /health
- GET /metadata
- GET /schema
- POST /mcp
- POST /reset
- POST /step
- GET /state

The deployed Space is currently validating with passed: true for required endpoint checks.

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

## Baseline Inference (Required)

The baseline script is at repository root:
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

## Testing

```bash
python test_mvp.py
```

## Deployment to Hugging Face Spaces

1. Push latest code to GitHub.
2. Create a Docker Space.
3. Connect the repository.
4. Set Space secrets and variables:
	- API_BASE_URL
	- MODEL_NAME
	- HF_TOKEN and/or OPENAI_API_KEY
5. Redeploy and validate.

## Judge Demo Script (Short)

1. Paste incident text with high latency and error spike.
2. Show generated scenario and initial metrics.
3. Take a few actions in dashboard and narrate tradeoffs.
4. Show grader score and episode outcome.
5. Reference media assets for full runthrough.

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
```

## Security

- .env is ignored by git
- use .env.example as template
- rotate leaked keys immediately
- store production secrets only in provider secret managers

## License

MIT

## Demo Assets (Direct Links)

- [Landing Page MP4 (showcase)](media/frontpage.mp4)
- [Grading Result JPG](media/grading.jpeg)
- [Dashboard Showcase GIF](media/dashboard.gif)
- [Proper Runthrough Video](media/working.mp4)
