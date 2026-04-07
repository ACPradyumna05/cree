# CREE Hackathon MVP — Deployment & Setup Guide

## 🚀 Quick Deployment Checklist

### Prerequisites
- ✅ Python 3.10+ installed
- ✅ Node.js 16+ installed
- ✅ Docker & Docker Compose (optional, but recommended)
- ✅ Git

---

## 🐳 Option 1: Docker Deployment (Recommended)

### Local Docker Deployment
```bash
# 1. Clone repo
git clone https://github.com/yourusername/cree.git
cd cree

# 2. Start everything with Docker Compose
docker-compose up

# 3. Wait 30-60 seconds for build
# 4. Open http://localhost:3000
```

**What happens:**
- Backend starts on http://localhost:8000
- Frontend builds and starts on http://localhost:3000
- Both connected via internal Docker network
- Hot reload enabled for development

**To stop:**
```bash
docker-compose down
```

**To rebuild (after code changes):**
```bash
docker-compose up --build
```

---

## 🏠 Option 2: Manual Local Setup

### Backend
```bash
# 1. Create virtual environment
python -m venv venv
source venv/Scripts/activate  # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start server
python -m uvicorn server.app:app --port 8000 --reload

# Server runs on http://localhost:8000
```

### Frontend (Separate Terminal)
```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start dev server
npm start

# Frontend opens on http://localhost:3000
```

---

## ☁️ Option 3: HuggingFace Spaces Deployment

### Pre-deployment Requirements
- HuggingFace account (free)
- This repo pushed to GitHub

### Step 1: Create HuggingFace Space
1. Go to https://huggingface.co/spaces
2. Click **Create new Space**
3. Configure:
   - Name: `cree-hackathon`
   - License: MIT
   - SDK: **Docker**
   - Space hardware: **Free CPU** (or GPU if available)

### Step 2: Connect Repository
```
Repo URL: https://github.com/yourusername/cree
Branch: main
```

### Step 3: Deploy
- HuggingFace automatically builds Docker image
- Deploys to public URL
- Takes 3-5 minutes

### Step 4: Access
Your app is now live at:
```
https://huggingface.co/spaces/yourusername/cree-hackathon
```

**Note:** The `README.md` header (with `---` and `sdk: docker`) enables this!

---

## 🧪 Testing Before Deployment

### Run Test Suite
```bash
python test_mvp.py
```

**Output:**
```
============================================================
CREE Hackathon MVP - Local Test Suite
============================================================
1. Testing backend imports...
   OK: All backend modules import successfully

2. Testing incident analysis...
   OK: Incident analyzed
      - Severity: critical
      - Signals detected: 5
      - Summary: Detected: elevated latency, increased errors...

3. Testing scenario creation...
   OK: Scenario created
      - Task: recovery
      - Risk Level: 10.0
      - Trigger Armed: False

4. Testing project creation from registry...
   OK: Project created and retrieved
      - Session ID: a1b2c3d4
      - Task: recovery

5. Testing backwards compatibility...
   OK: Backwards compatibility routes present
      - /reset
      - /step
      - /state

============================================================
Tests Passed: 5/5
============================================================
```

**If all tests pass:** You're ready to deploy! ✅

---

## 📝 Manual API Testing

### Test Incident Analysis (Main Feature)
```bash
curl -X POST http://localhost:8000/incidents/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "incident_text": "Production alert: API latency increased to 3000ms, error rate 8%, database CPU 95%"
  }'
```

**Response:**
```json
{
  "session_id": "a7f3d2",
  "analysis": {
    "severity": "high",
    "extracted_signals": {
      "latency_spike": true,
      "error_rate_increase": true,
      "cpu_spike": true,
      "cascading_failures": false,
      "throughput_drop": false
    }
  },
  "scenario": {
    "task": "recovery",
    "initial_hidden": {
      "risk_level": 8.5,
      "memory_pressure": 1.0,
      "trigger_armed": false
    }
  }
}
```

### Test Backend Health
```bash
curl http://localhost:8000/health
# Response: {"status": "ok", "version": "2.0.0"}
```

### Test Old API (Backwards Compat)
```bash
curl -X POST http://localhost:8000/reset
curl http://localhost:8000/state
curl http://localhost:8000/actions
```

---

## 🔍 Troubleshooting

### Docker Build Fails
```bash
# Clear Docker cache
docker system prune -a

# Rebuild
docker-compose up --build
```

### Frontend doesn't connect to backend
- Check backend is running on port 8000
- In frontend, verify `REACT_APP_API_URL` is set to `http://localhost:8000` (local) or backend URL (production)

### Port 3000 or 8000 already in use
```bash
# Find what's using port 3000
lsof -i :3000
# Kill process
kill -9 <PID>

# Or use different port
docker-compose exec backend uvicorn server.app:app --port 8001
```

### WebSocket connection fails
- Ensure both http:// and ws:// URLs work
- Frontend will fall back to HTTP polling (slower but works)

### Tests fail
```bash
# Make sure backend imports work
python -c "from server.app import app"
python -c "from server.incidents import IncidentAnalyzer"

# Check Python version
python --version  # Should be 3.10+
```

---

## 📊 Performance Tips

### For Local Development
- Use `--reload` flag for fast iteration
- Keep Docker volumes mounted for live changes
- Frontend hot reload happens automatically

### For Production (HF Spaces)
- Docker image is optimized (multi-stage build)
- Frontend minified bundle
- Backend runs on gunicorn (if needed)

---

## 🔐 Environment Variables

### For HuggingFace Spaces
No env vars required! The MVP works without OpenAI.

### If adding LLM baseline later
```bash
OPENAI_API_KEY=sk-xxx...
MODEL_NAME=gpt-4o-mini
API_BASE_URL=https://api.openai.com/v1
```

---

## 📈 Scaling Considerations

### Current Setup
- Single-machine deployment
- In-memory session storage
- SQLite optional (not configured)

### For Production Scale
1. **Add database**: PostgreSQL with SQLAlchemy
2. **Add auth**: JWT tokens + user accounts
3. **Add caching**: Redis for session storage
4. **Add logging**: CloudWatch or similar
5. **Add monitoring**: Prometheus + Grafana

---

## 🎯 Deployment Checklist

- [ ] All tests pass (`python test_mvp.py`)
- [ ] Local Docker works (`docker-compose up`)
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Backend health check passes (`curl http://localhost:8000/health`)
- [ ] Incident analysis works (`curl -X POST /incidents/analyze`)
- [ ] README.md is updated
- [ ] Code is committed to git
- [ ] GitHub repo is public
- [ ] HuggingFace Space created and connected
- [ ] Deployment successful and accessible

---

## 🚀 You're Ready!

Your CREE hackathon MVP is ready for:
- ✅ Local testing
- ✅ Docker deployment
- ✅ HuggingFace Spaces deployment
- ✅ Hackathon submission

**Next:** Share the link and get feedback!

---

**Questions?** Check `LOCAL_TESTING_GUIDE.md` or `INTEGRATION_GUIDE.md` for more details.
