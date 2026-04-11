# CREE: Causal Reverse Engineering Engine

Most AI agents can optimize reward. Very few can **understand why things happen**.

CREE is an interactive benchmark and training environment that measures causal understanding under **partial observability, delayed effects, and sequence-sensitive failures**.

---

## If You Read One Paragraph

Current AI evaluations often reward shortcut behavior that looks good in metrics but fails in real-world systems with hidden dependencies.

CREE simulates those hidden dynamics and asks one practical question:

> **Can an agent (or human) diagnose and recover systems by understanding causality, not just by chasing immediate reward?**

---

## 30-Second Overview

### Problem

Standard evaluations reward shortcuts, not real reasoning under uncertainty.

### What CREE does

* Converts plain-text incidents into interactive system scenarios
* Hides true internal dynamics while exposing realistic metrics
* Forces agents (or humans) to discover latent rules step-by-step
* Grades outcomes on stability, recovery quality, and cascade prevention

### Why this matters

* Stronger signal for trustworthy AI behavior
* Direct relevance to real-world incident response and system debugging

---

## Who Needs This Right Now

* AI evaluation teams testing reliability before deployment
* SRE / DevOps teams practicing incident-response drills
* Anyone who wants to evaluate **real reasoning, not just reward optimization**

---

## What You Actually Do In The App

### 1. Manual exploration (dashboard)

* Select a task
* Reset episode
* Take actions and observe metric changes
* Analyze results and grade performance

### 2. LLM benchmark (terminal)

* Run:

  ```bash
  python inference.py
  ```
* Requires OpenAI-compatible API credentials
* Used to evaluate external models (optional)

---

## Live Links

* Hugging Face Space: https://kr4ter-cree-sre.hf.space

Validation:

```bash
openenv validate https://kr4ter-cree-sre.hf.space
```

---

## Demo Media

* Landing Page: [Watch video](media/frontpage.mp4)
* Grading Result: [View image](media/grading.jpeg)
* Dashboard Showcase:
  ![Dashboard Showcase](media/dashboard.gif)
* Full Runthrough: [Watch video](media/working.mp4)

---

## How It Works

1. Submit incident text (dashboard or API)
2. Analyzer extracts system signals (latency, errors, CPU, etc.)
3. Scenario generator creates hidden system state
4. Agent/operator takes actions
5. Grader evaluates performance in range **[0, 1]**

---

## Core Innovation

The environment behaves like real systems:

* **Delayed effects** → actions don’t show impact immediately
* **Sequence traps** → same action can help or harm depending on order
* **Hidden dependencies** → internal rules are not visible
* **Observable outcomes** → results are measurable and traceable

---

## Feature Highlights

* FastAPI backend (OpenEnv-compatible)
* React + TypeScript dashboard
* Real-time metrics via WebSocket
* Multi-project session isolation
* Incident-to-scenario pipeline
* Task-based grading system
* Docker + Hugging Face deployment

---

## 60-Second Demo

1. Paste an incident report
2. Show extracted signals
3. Start simulation
4. Take 4–6 actions
5. Show wrong vs correct decisions
6. Display final score

> “This tests causal understanding, not just reward optimization.”

---

## OpenEnv Compliance

Supported endpoints:

* `GET /openapi.json`
* `GET /health`
* `GET /metadata`
* `GET /schema`
* `POST /reset`
* `POST /step`
* `GET /state`

---

## Core API Surface

### Runtime

* `POST /reset`
* `POST /step`
* `GET /state`

### Environment

* `GET /actions`
* `GET /tasks`
* `POST /grade`

### Incident pipeline

* `POST /incidents/analyze`

---

## Architecture

```text
Frontend (React)
   → UI, controls, metrics

Backend (FastAPI)
   → API, sessions, scenario generation

Environment Engine
   → hidden causal logic

Task Graders
   → scoring system
```

---

## Local Setup

### Docker

```bash
docker-compose up --build
```

### Manual

Backend:

```bash
python -m venv venv
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

---

## Testing

```bash
python -m pytest -q
python test_mvp.py
python scripts/preflight.py
```

---

## Repository Layout

```text
cree/
├── server/
├── env/
├── tasks/
├── frontend/
├── media/
├── inference.py
├── Dockerfile
├── docker-compose.yml
├── test_mvp.py
```

---

## Future Scope

* Decision timeline visualization
* Counterfactual replay (“what if” mode)
* Exportable traces
* Domain-specific scenarios

---

## Security

* `.env` is ignored
* Use `.env.example`
* Store secrets securely

---

## License

MIT
