// API Response Types
export interface ObservableState {
  latency: number;
  error_rate: number;
  throughput: number;
  cpu_load: number;
  status: 'normal' | 'warning' | 'critical' | 'recovering';
}

export interface StepResult {
  observation: ObservableState;
  state: ObservableState;
  reward: number;
  done: boolean;
  info: Record<string, any>;
}

export interface ResetResponse {
  observation: ObservableState;
  state: ObservableState;
  task: string | null;
  done: boolean;
  message: string;
}

export interface ActionDefinition {
  name: string;
  description: string;
  category: string;
}

export interface TaskDefinition {
  id: string;
  name: string;
  difficulty: string;
  max_steps: number;
  description: string;
}

export interface HealthResponse {
  status: string;
  version: string;
}

export interface Episode {
  episode: number;
  phase: [number, string];
  total_reward: number;
  steps: number;
  rules_verified: number;
  hypotheses: number;
  avg_pred_acc: number;
  exploration: number;
}

export interface HistoryEntry {
  step: number;
  action: string;
  timestamp: number;
  state: ObservableState;
  reward: number;
  done: boolean;
}

// Project/Session Types
export interface ProjectInfo {
  session_id: string;
  current_task: string | null;
  created_at: string;
  last_accessed: string;
  status: 'active' | 'completed' | 'failed';
  steps_taken: number;
  total_reward: number;
}

export interface CreateProjectResponse {
  session_id: string;
  project: ProjectInfo;
  message: string;
}

export interface ListProjectsResponse {
  projects: ProjectInfo[];
  stats: {
    total_projects: number;
    active_projects: number;
    total_steps_across_all: number;
    total_reward_across_all: number;
  };
}

export interface GetProjectResponse {
  session_id: string;
  project: ProjectInfo;
}

export interface MetricUpdate {
  type: 'metric_update' | 'metric_batch';
  timestamp?: number;
  observation?: ObservableState;
  step_info?: {
    action: string;
    reward: number;
    done: boolean;
  };
  updates?: Array<{
    type: string;
    timestamp: number;
    observation: ObservableState;
    step_info: Record<string, any>;
  }>;
}

// Incident Analysis Types
export interface IncidentAnalysis {
  incident_text: string;
  extracted_signals: {
    latency_spike: boolean;
    error_rate_increase: boolean;
    throughput_drop: boolean;
    cpu_spike: boolean;
    cascading_failures: boolean;
  };
  summary: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface IncidentScenarioResponse {
  session_id: string;
  project: ProjectInfo;
  analysis: IncidentAnalysis;
  message: string;
}
