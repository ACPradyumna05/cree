# CREE Frontend

Interactive React dashboard for the Causal Reverse Engineering Engine (CREE) environment.

## Quick Start

### 1. Install dependencies
```bash
cd frontend
npm install
```

### 2. Configure API endpoint (optional)
Create a `.env` file in the `frontend` directory:
```
REACT_APP_API_URL=http://localhost:8000
```

### 3. Start development server
```bash
npm start
```

The dashboard will open at `http://localhost:3000`

### 4. Ensure CREE backend is running
In another terminal:
```bash
cd ..
python -m uvicorn server.app:app --port 8000 --reload
```

## Features

### Usage Modes
- Manual mode: choose a task, reset, take actions, then grade.
- LLM mode: optional terminal workflow via `inference.py` (requires API key).

### Metrics Display
- Real-time visualization of system metrics:
  - Latency (ms)
  - Error Rate (%)
  - Throughput (req/s)
  - CPU Load (%)

### System Status
- Status indicator (normal/warning/critical/recovering)
- Color-coded metrics based on thresholds

### Task Selection
- Choose from available tasks
- Free exploration mode
- Task-specific grading

### Episode Controls
- Reset environment
- Execute actions
- Track episode statistics

### Episode History
- Timestamped step history
- Action, state, and reward tracking

## Project Structure

```
frontend/
├── src/
│   ├── api.ts                    # API client
│   ├── types.ts                  # TypeScript interfaces
│   ├── components/
│   │   ├── Dashboard.tsx         # Main dashboard
│   │   ├── MetricsDisplay.tsx    # Metrics
│   │   ├── ActionButtons.tsx     # Action panel
│   │   └── HistoryLog.tsx        # History
│   ├── App.tsx
│   └── index.tsx
```

## Environment Variables

- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:8000)

## Build for Production

```bash
npm run build
```

This creates an optimized production build in `/build` directory.
