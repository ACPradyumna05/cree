---
title: CREE Hackathon MVP
sdk: docker
app_port: 8000
---

# 🚀 CREE — Causal Reverse Engineering Engine

## Transform Incident Reports into Interactive SRE Training Scenarios

**CREE turns real incident reports into hands-on incident response simulations** — giving SRE teams a safe, effective way to practice critical skills.

### The Problem We Solve
- 🚨 SREs struggle to practice incident response safely
- 📋 Most training is theoretical, not experiential
- 🔄 Scenarios are generic, not based on real incidents
- ⏱️ Learning (or not) only happens in production emergencies

### Our Solution
```
Your Incident Report
        ↓
[System analyzes it]
        ↓
Realistic training scenario
        ↓
Interactive sandbox to practice
        ↓
Real-time feedback + learning
```

---

## ⚡ Quick Start

### Option 1: Try It Live (Easiest)
👉 **[Open CREE on HuggingFace Spaces](https://huggingface.co/spaces)** — No setup needed!

### Option 2: Run Locally (2 minutes)

```bash
# Clone the repo
git clone https://github.com/yourusername/cree.git
cd cree

# Start backend + frontend with Docker
docker-compose up

# Or manually (separate terminals):

# Terminal 1: Backend
python -m uvicorn server.app:app --port 8000 --reload

# Terminal 2: Frontend
cd frontend && npm start
```

Then open **http://localhost:3000** in your browser.

---

## 🎯 How It Works

### Step 1: Paste Your Incident Report
```
"Production alert: API latency increased from 150ms to 3500ms.
Error rate jumped to 12%. Database CPU at 98%.
Multiple services timing out."
```

### Step 2: System Analyzes It
- Detects signal patterns (latency spikes, errors, cascades, etc.)
- Calculates incident severity (low → critical)
- Generates realistic environment state matching the signals

### Step 3: Practice in Interactive Dashboard
- **Observe** real-time system metrics
- **Execute** 10 different recovery actions
- **Discover** hidden causal rules through experimentation
- **Get scored** on your approach

### Step 4: Learn Through Doing
Users naturally discover patterns like:
- ✓ Which actions help in stressed state
- ✓ When to wait vs. when to act
- ✓ Root causes of cascading failures
- ✓ Time-optimal recovery sequences

---

## 🧠 The AI Behind the Scenes

### Incident Analysis Engine (No LLM needed!)
- **Keyword extraction**: Detects latency spikes, CPU overload, cascades, etc.
- **Signal correlation**: Maps symptoms to scenario parameters
- **Severity detection**: Auto-classifies as low/medium/high/critical
- **Scenario synthesis**: Creates realistic environment state

### Simulation Engine
- **Black-box environment**: 7 hidden causal rules
- **Realistic dynamics**: Non-linear effects, time delays, cascades
- **Multiple difficulty levels**: Easy (stability) to hard (cascade prevention)

---

## 🎮 Features

### For Users
- ✅ **Incident form** — Paste any incident report
- ✅ **Real-time metrics** — Latency, error rate, throughput, CPU load
- ✅ **Action buttons** — 10 different recovery strategies
- ✅ **History tracking** — See every step you took
- ✅ **Episode grading** — Get scored on performance
- ✅ **Multi-scenario support** — Create multiple training scenarios
- ✅ **WebSocket live updates** — Real-time feedback without polling

### For Developers
- ✅ **FastAPI backend** — Professional async framework
- ✅ **React frontend** — Modern UI with real-time updates
- ✅ **Multi-project isolation** — Each user gets their own scenario
- ✅ **Session persistence** — localStorage for continuity
- ✅ **Backwards compatible** — Old API endpoints still work
- ✅ **Fully typed** — TypeScript + Pydantic validation
- ✅ **Docker + Docker Compose** — One-command deployment
- ✅ **HuggingFace Spaces ready** — Deploy with click

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────┐
│         Incident Analysis Pipeline              │
│  (Keyword extraction → Signal detection)        │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│       Scenario Generation Engine                │
│  (Maps signals to environment state)            │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│    FastAPI Backend (Multi-Project)              │
│  • Session isolation                            │
│  • Real-time WebSocket streaming                │
│  • Environment simulation                       │
│  • Grading system                               │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│      React Dashboard (Real-time UI)             │
│  • Incident form                                │
│  • Metrics display                              │
│  • Action execution                             │
│  • Episode tracking                             │
└─────────────────────────────────────────────────┘
```

---

## 📖 Example User Flow

### Scenario: Payment Service Outage

**User input:**
```
CRITICAL: Payment service down. Latency 5000ms,
error rate 25%, DB CPU maxed at 99%,
cascading failures to checkout service.
```

**System output:**
- Severity: **CRITICAL**
- Signals detected: All 5 (latency, errors, throughput, CPU, cascades)
- Task: **cascade_prevention**
- Risk level: **10.0** (max)
- Time to practice: **30 steps**

**User practices:**
1. Click `probe_latency` → "Latency confirmed at 5000ms"
2. Click `force_gc` → "Garbage collection triggered, memory dropped 2%"
3. Click `reset_connections` → "Connection pool reset, latency dropped 500ms"
4. Click `wait` → "System recovering, risk down 1.5"
5. Click `stabilize` → "Risk reduced by 2!"
6. ... (continues until system recovers or failure occurs)

**Results:**
- Steps to recovery: 12 steps (out of 30)
- Grade: **Strong recovery** (93% score)
- Learning: "reset_connections + wait is the optimal sequence"

---

## 🔧 Technologies

| Component | Stack |
|-----------|-------|
| **Backend** | FastAPI, Pydantic, Python 3.10+ |
| **Frontend** | React 18, TypeScript, Real-time WebSocket |
| **Simulation** | Custom black-box environment with 7 hidden rules |
| **Deployment** | Docker, Docker Compose, HuggingFace Spaces |
| **Testing** | Python unittest, built-in test suite |

---

## 📚 API Endpoints

### Incident Analysis (Main Feature)
```bash
POST /incidents/analyze
Content-Type: application/json
{
  "incident_text": "Latency spike, 5000ms, CPU 95%, cascading failures"
}

Response:
{
  "session_id": "a7f3d2",
  "analysis": {
    "severity": "critical",
    "extracted_signals": {
      "latency_spike": true,
      "error_rate_increase": true,
      "cpu_spike": true,
      "cascading_failures": true
    }
  },
  "scenario": {
    "task": "cascade_prevention",
    "initial_hidden": {
      "risk_level": 10.0,
      "trigger_armed": false
    }
  }
}
```

### Project Management
```bash
POST   /projects              # Create project
GET    /projects              # List all projects
GET    /projects/{id}         # Get project info
DELETE /projects/{id}         # Delete project
POST   /projects/{id}/reset   # Reset environment
POST   /projects/{id}/step    # Execute action
GET    /projects/{id}/state   # Get current state
WS     /ws/{id}               # Real-time metrics
```

### Backwards Compatibility
```bash
POST /reset    # Legacy endpoint (still works!)
POST /step
GET  /state
GET  /actions
POST /grade
```

---

## 🧪 Testing

**Run the test suite:**
```bash
python test_mvp.py
```

**Expected output:**
```
✅ All backend modules import successfully
✅ Incident analysis works
✅ Scenario creation OK
✅ Project registry OK
✅ Backwards compatibility verified

Tests Passed: 5/5
```

---

## 📦 Deployment

### Option 1: Docker (Local)
```bash
docker-compose up
# Opens on http://localhost:3000
```

### Option 2: Docker (Production)
```bash
docker build -t cree:latest .
docker run -p 8000:8000 cree:latest

# Frontend:
cd frontend
npm run build
npm install -g serve
serve -s build -l 3000
```

### Option 3: HuggingFace Spaces
This repo is pre-configured for HuggingFace Spaces!

1. Create a new Space on HuggingFace
2. Choose "Docker" as SDK
3. Point to this repo
4. Click Deploy!

---

## 🎓 Learning Model

Users discover incident response through **interactive exploration**:

### Observable Metrics
- `latency`: Response time in milliseconds
- `error_rate`: Fraction of failed requests
- `throughput`: Requests per second
- `cpu_load`: CPU utilization (0-1)
- `status`: System health (normal/warning/critical/recovering)

### Hidden State (Discovered Through Play)
- `risk_level`: Internal pressure driving metrics
- `memory_pressure`: RAM saturation
- `trigger_armed`: Cascade enabler
- `system_mode`: Current condition
- `cascade_counter`: Steps until failure

### 10 Actions to Master
- `probe_latency` — Light diagnostic
- `stress_cpu` — Load test (risky)
- `inject_load` — Traffic spike (very risky if armed)
- `wait` — Let system recover
- `reset_connections` — Connection pool reset (context-dependent!)
- `force_gc` — Garbage collection (backfires when risk high)
- `probe_memory` — Memory diagnostic
- `toggle_debug` — Arms/disarms cascade trigger
- `stabilize` — Risk reduction (only works when risk < 6)
- `emergency_stop` — Hard reset

---

## 🏆 Hackathon Features

✅ **Novel problem**: Converts incident reports → training scenarios
✅ **Lightweight**: No LLM required, keyword-based analysis
✅ **Fast**: Instant scenario generation, real-time UI
✅ **Scalable**: Multi-project, multi-user support
✅ **Production-ready**: Docker, DockerCompose, HF Spaces
✅ **Well-tested**: 5/5 tests passing, backwards compatible
✅ **Great UX**: Incident form → dashboard, intuitive controls
✅ **Educational**: Users actually learn incident response!

---

## 📋 Project Structure

```
cree/
├── server/
│   ├── app.py              # FastAPI main server
│   ├── sessions.py         # Multi-project registry
│   ├── ws_handler.py       # WebSocket real-time updates
│   ├── incidents.py        # Incident analysis engine
│   └── __init__.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.tsx       # Main UI
│   │   │   ├── IncidentForm.tsx    # Incident input
│   │   │   ├── MetricsDisplay.tsx  # Metrics viz
│   │   │   ├── ActionButtons.tsx   # Action controls
│   │   │   └── HistoryLog.tsx      # Step history
│   │   ├── api.ts                  # API client
│   │   ├── types.ts                # TypeScript types
│   │   └── App.tsx                 # App entry
│   ├── Dockerfile
│   └── package.json
├── env/
│   ├── environment.py              # Simulation engine
│   └── __init__.py
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── test_mvp.py                     # MVP test suite
├── demo.py                         # Original RL demo (still works!)
└── README.md                       # This file!
```

---

## 🚀 Next Steps

### For Judges
1. **Try it**: Paste an incident → practice response
2. **Explore**: Test different action sequences
3. **Learn**: Discover the hidden causal rules
4. **Grade**: Get scored on recovery approach

### For Developers
1. **Extend signals**: Add more incident patterns
2. **Add scenarios**: Customize difficulty levels
3. **Persist data**: Add database backend
4. **Scale users**: Add authentication + multi-tenant
5. **Integrate real incidents**: Feed actual post-mortems

---

## 📄 License

MIT License - Free for educational and commercial use

---

## 👥 Contributing

We welcome contributions! Areas to expand:
- More incident patterns/signals
- Additional environment rules
- Better grading algorithms
- Mobile UI support
- API rate limiting
- User authentication

---

## 🎯 The Vision

CREE is building the **incident response training platform for the cloud era**.

By converting real-world incidents into safe, interactive scenarios, we're helping SREs:
- ✅ Practice critical skills without production risk
- ✅ Discover system behavior through experimentation
- ✅ Build intuition for complex failure modes
- ✅ Prepare teams for real emergencies

**Every incident is a learning opportunity. Let's make that happen.**

---

**Made with ❤️ for hackathons and SRE teams worldwide** 🚀

Questions? Open an issue or reach out!
