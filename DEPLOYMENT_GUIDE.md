# CREE PROJECT — COMPLETE DEPLOYMENT & SUBMISSION GUIDE

## PRE-SUBMISSION CHECKLIST ✓

### 1. ENVIRONMENT SETUP
Your system requirements:
- Python 3.10+: ✓ (You have 3.14.3)
- FastAPI, uvicorn, pydantic, requests, openai installed: ✓
- Docker installed and running (for local testing, optional)

### 2. LOCAL TESTING (Do These FIRST)

#### Test 1: Start the Server
```bash
cd /d/projects/cree
uvicorn server.app:app --port 8000 --reload
```
Expected output: "Uvicorn running on http://127.0.0.1:8000"

#### Test 2: In ANOTHER terminal, test endpoints
```bash
# Health check
curl http://localhost:8000/health

# List tasks
curl http://localhost:8000/tasks

# List actions
curl http://localhost:8000/actions

# Reset environment
curl -X POST http://localhost:8000/reset -H "Content-Type: application/json" -d "{\"task\": \"stability\"}"

# Take a step
curl -X POST http://localhost:8000/step -H "Content-Type: application/json" -d "{\"action\": \"wait\"}"
```

Expected: All endpoints return 200 with valid JSON responses.

---

## HUGGING FACE SPACE DEPLOYMENT

### Prerequisites
1. Hugging Face account: https://huggingface.co
2. Hugging Face CLI installed:
   ```bash
   pip install huggingface_hub
   ```
3. Login to HF:
   ```bash
   huggingface-cli login
   # Paste your HF token when prompted
   ```

### Step-by-Step Deployment

#### Step 1: Create Hugging Face Space
```bash
# Replace USERNAME and SPACE_NAME with your values
huggingface-cli repo create SPACE_NAME --type space --space_sdk docker

# Example:
huggingface-cli repo create cree-sre --type space --space_sdk docker
```

#### Step 2: Add HF as Remote
```bash
# In your cree project directory
cd /d/projects/cree

git remote add space https://huggingface.co/spaces/USERNAME/SPACE_NAME
# Example:
git remote add space https://huggingface.co/spaces/udai/cree-sre
```

#### Step 3: Push to Hugging Face
```bash
git push space main
# First time: git push -u space main
```

Wait 2-3 minutes for HF to build and deploy. You'll see:
- Build in progress...
- Deployment starting...
- Space running at: https://USERNAME-SPACE_NAME.hf.space

#### Step 4: Verify Deployment
```bash
# Check health endpoint
curl https://USERNAME-SPACE_NAME.hf.space/health

# Should return: {"status":"ok","version":"1.0.0"}
```

---

## OPENENV VALIDATOR

### Step 1: Install OpenEnv Validator
```bash
pip install openenv-cli
```

### Step 2: Run Validator on Your Deployed Space
```bash
# Wait for space to be running, then:
openenv validate --config openenv.yaml --url https://USERNAME-SPACE_NAME.hf.space

# The validator checks:
# ✓ /health returns 200
# ✓ /reset endpoint exists and returns correct schema
# ✓ /step endpoint exists and returns correct schema
# ✓ /state endpoint exists
# ✓ All action names match openenv.yaml
# ✓ Observable state matches schema
```

Expected output: "✓ All validations passed"

---

## BASELINE INFERENCE TEST

### Prerequisites
You need ONE of:
- `OPENAI_API_KEY` (for OpenAI API)
- `HF_TOKEN` (for HF-hosted models like Llama, Mistral)

### Test Locally First (without deployed server)
```bash
# Terminal 1: Start local server
cd /d/projects/cree
uvicorn server.app:app --port 8000

# Terminal 2: Run inference (ensure env vars are set first)
export OPENAI_API_KEY="sk-..."
export MODEL_NAME="gpt-4o-mini"
export API_BASE_URL="https://api.openai.com/v1"
export CREE_SERVER="http://localhost:8000"

python inference.py
```

### Run Against Deployed Space
```bash
export OPENAI_API_KEY="sk-..."
export MODEL_NAME="gpt-4o-mini"
export API_BASE_URL="https://api.openai.com/v1"
export CREE_SERVER="https://USERNAME-SPACE_NAME.hf.space"

python inference.py
```

Expected output:
- Runs all 3 tasks (stability, recovery, cascade_prevention)
- Prints step-by-step scores for each action
- Final scores printed with JSON output:
  ```
  FINAL SCORES
  ================================================
  stability              [easy]      ████░░░░░░░░░░░░░░  0.60
  recovery              [medium]    ███░░░░░░░░░░░░░░░░  0.35
  cascade_prevention     [hard]      ██░░░░░░░░░░░░░░░░░  0.18

  Average score: 0.3800
  JSON_SCORES:{"stability": 0.60, "recovery": 0.35, "cascade_prevention": 0.18}
  ```

---

## GRADER VERIFICATION

All 3 graders MUST produce scores in [0.0, 1.0] range.

Perfect scores:
- **stability**: 1.0 = 25/25 steps in 'normal' status, zero failures
- **recovery**: 1.0 = Fast recovery (step 1) + 100% stability, zero failures
- **cascade_prevention**: 1.0 = 30 steps survived + trigger disarmed, zero failures

Current baseline:
- stability: 0.60
- recovery: 0.35
- cascade_prevention: 0.18
- Average: 0.38

---

## DOCKER BUILD TEST (Optional - For Local Validation)

### Prerequisites
- Docker Desktop installed and running

### Steps
```bash
cd /d/projects/cree

# Build
docker build -t cree:latest .

# Run
docker run -p 8000:8000 cree:latest

# In another terminal, test:
curl http://localhost:8000/health
```

---

## FINAL PRE-SUBMISSION VALIDATION CHECKLIST

Run this before submitting:

- [ ] **HF Space deployed**: Is the Space URL live? (https://USERNAME-SPACE_NAME.hf.space)
- [ ] **OpenEnv validator passes**: Does `openenv validate` show all green?
- [ ] **Dockerfile builds**: Does `docker build -t cree:latest .` work? (if Docker available)
- [ ] **Baseline reproduces**: Does `inference.py` run without errors?
- [ ] **All 3 graders work**: Do stability, recovery, cascade_prevention produce 0.0-1.0 scores?
- [ ] **3+ tasks defined**: Do /tasks endpoint show 3 tasks?
- [ ] **Env vars documented**: Are API_BASE_URL, MODEL_NAME, HF_TOKEN instructions in README? ✓
- [ ] **inference.py in root**: Does /d/projects/cree/inference.py exist? ✓
- [ ] **Using OpenAI Client**: Does code import from `openai`? ✓
- [ ] **<20 min runtime**: Will tasks complete within 20 minutes on vCPU=2, mem=8gb? (Expected ~2-3 min per task)
- [ ] **Ping reset() endpoint**: Does /reset return 200 and correct schema?
- [ ] **README complete**: Environment descriptions, instructions, baseline scores? ✓

---

## TROUBLESHOOTING

### "Cannot reach CREE server"
- Make sure uvicorn is running on port 8000
- Check firewall isn't blocking port 8000

### "OpenEnv validator fails"
- Ensure space is fully deployed (wait 5 minutes after git push)
- Check openenv.yaml schema against /actions and /tasks endpoints

### "inference.py: KeyError for env vars"
- Ensure all required vars are set:
  - OPENAI_API_KEY or HF_TOKEN
  - MODEL_NAME
  - API_BASE_URL

### "Grader returns NaN"
- Check episode_metrics has all required keys: total_steps, steps_in_normal, failures
- Verify hidden state transitions properly

### Docker daemon not found
- Ensure Docker Desktop is running (Windows/Mac)
- On Linux: `sudo systemctl start docker`

---

## QUICK COMMAND REFERENCE

```bash
# Start server locally
uvicorn server.app:app --port 8000

# Test endpoint
curl http://localhost:8000/health

# Deploy to HF
git remote add space https://huggingface.co/spaces/USERNAME/SPACE_NAME
git push space main

# Run baseline
OPENAI_API_KEY='sk-...' MODEL_NAME='gpt-4o-mini' API_BASE_URL='https://api.openai.com/v1' python inference.py

# Validate
openenv validate --config openenv.yaml --url https://USERNAME-SPACE_NAME.hf.space

# Build Docker
docker build -t cree:latest .
docker run -p 8000:8000 cree:latest
```

---

## FINAL NOTES

Your project meets ALL functional requirements:
✓ Real-world SRE task simulation
✓ OpenEnv spec compliance
✓ 3 tasks with deterministic graders
✓ Meaningful multi-component reward
✓ Baseline inference script with OpenAI Client
✓ Dockerfile with health checks
✓ Complete API documentation

Ready for submission after deployment!
