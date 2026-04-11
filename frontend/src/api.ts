import {
  ObservableState,
  StepResult,
  ResetResponse,
  ActionDefinition,
  TaskDefinition,
  HealthResponse,
  CreateProjectResponse,
  ListProjectsResponse,
  GetProjectResponse,
  MetricUpdate,
} from './types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const WS_BASE_URL = (process.env.REACT_APP_WS_URL || API_BASE_URL).replace(/^http/, 'ws');

interface MetricListener {
  (metric: MetricUpdate): void;
}

class CREEClient {
  private baseUrl: string;
  private wsUrl: string;
  private sessionId: string | null = null;
  private ws: WebSocket | null = null;
  private metricListeners: MetricListener[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(baseUrl: string = API_BASE_URL, wsUrl: string = WS_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.wsUrl = wsUrl.replace(/\/$/, '');
    this.loadSessionFromStorage();
  }

  private loadSessionFromStorage() {
    const stored = localStorage.getItem('cree_session_id');
    if (stored) {
      this.sessionId = stored;
    }
  }

  private saveSessionToStorage() {
    if (this.sessionId) {
      localStorage.setItem('cree_session_id', this.sessionId);
    } else {
      localStorage.removeItem('cree_session_id');
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, any>
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        let detail = response.statusText;
        try {
          const errorBody = await response.json();
          if (errorBody?.detail) {
            detail = typeof errorBody.detail === 'string' ? errorBody.detail : JSON.stringify(errorBody.detail);
          }
        } catch {
          // Ignore JSON parsing failures and keep status text fallback.
        }
        throw new Error(`HTTP ${response.status}: ${detail}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`API Error [${method} ${path}]:`, error);
      throw error;
    }
  }

  // ========================================================================
  // Legacy API (Backwards Compatibility)
  // ========================================================================

  async health(): Promise<HealthResponse> {
    return this.request('GET', '/health');
  }

  async reset(task?: string): Promise<ResetResponse> {
    if (this.sessionId) {
      return this.request('POST', `/projects/${this.sessionId}/reset`, { task: task || null });
    }
    return this.request('POST', '/reset', { task: task || null });
  }

  async step(action: string): Promise<StepResult> {
    if (this.sessionId) {
      return this.request('POST', `/projects/${this.sessionId}/step`, { action });
    }
    return this.request('POST', '/step', { action });
  }

  async getState(): Promise<{ observation: ObservableState; state?: ObservableState }> {
    if (this.sessionId) {
      return this.request('GET', `/projects/${this.sessionId}/state`);
    }
    return this.request('GET', '/state');
  }

  async getActions(): Promise<{ actions: ActionDefinition[] }> {
    return this.request('GET', '/actions');
  }

  async getTasks(): Promise<{ tasks: TaskDefinition[] }> {
    return this.request('GET', '/tasks');
  }

  async grade(): Promise<Record<string, any>> {
    if (this.sessionId) {
      return this.request('POST', `/projects/${this.sessionId}/grade`);
    }
    return this.request('POST', '/grade');
  }

  // ========================================================================
  // Project Management API
  // ========================================================================

  async createProject(task?: string): Promise<CreateProjectResponse> {
    const response = await this.request<CreateProjectResponse>('POST', '/projects', {
      task: task || null,
    });
    this.setCurrentSession(response.session_id);
    return response;
  }

  async listProjects(): Promise<ListProjectsResponse> {
    return this.request('GET', '/projects');
  }

  async getProject(sessionId: string): Promise<GetProjectResponse> {
    return this.request('GET', `/projects/${sessionId}`);
  }

  async deleteProject(sessionId: string): Promise<{ message: string }> {
    const response = await this.request<{ message: string }>(
      'DELETE',
      `/projects/${sessionId}`
    );
    if (sessionId === this.sessionId) {
      this.setCurrentSession(null);
    }
    return response;
  }

  async projectReset(sessionId: string, task?: string): Promise<ResetResponse> {
    return this.request('POST', `/projects/${sessionId}/reset`, { task: task || null });
  }

  async projectStep(sessionId: string, action: string): Promise<StepResult> {
    return this.request('POST', `/projects/${sessionId}/step`, { action });
  }

  async projectGetState(sessionId: string): Promise<{ observation: ObservableState; state?: ObservableState }> {
    return this.request('GET', `/projects/${sessionId}/state`);
  }

  async projectGrade(sessionId: string): Promise<Record<string, any>> {
    return this.request('POST', `/projects/${sessionId}/grade`);
  }

  // ========================================================================
  // Session Management
  // ========================================================================

  getCurrentSession(): string | null {
    return this.sessionId;
  }

  setCurrentSession(sessionId: string | null) {
    const previousSessionId = this.sessionId;
    this.sessionId = sessionId;
    this.saveSessionToStorage();
    // Reconnect WebSocket if session changes
    if (previousSessionId !== sessionId) {
      this.disconnectWebSocket();
      if (sessionId) {
        this.connectWebSocket(sessionId);
      }
    }
  }

  // ========================================================================
  // WebSocket Real-Time Metrics
  // ========================================================================

  private connectWebSocket(sessionId: string) {
    if (this.ws) {
      return; // Already connected
    }

    try {
      const wsUrl = `${this.wsUrl}/ws/${sessionId}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log(`WebSocket connected to session ${sessionId}`);
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const metric = JSON.parse(event.data) as MetricUpdate;
          this.notifyListeners(metric);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (event) => {
        console.error('WebSocket error:', event);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.ws = null;
        // Attempt reconnect
        this.attemptReconnect(sessionId);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }

  private attemptReconnect(sessionId: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);
      console.log(`Attempting WebSocket reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connectWebSocket(sessionId), delay);
    }
  }

  private disconnectWebSocket() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  subscribeToMetrics(listener: MetricListener): () => void {
    this.metricListeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.metricListeners = this.metricListeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(metric: MetricUpdate) {
    this.metricListeners.forEach((listener) => {
      try {
        listener(metric);
      } catch (error) {
        console.error('Error in metric listener:', error);
      }
    });
  }

  isWebSocketConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getWebSocketStatus(): string {
    if (!this.ws) {
      return 'disconnected';
    }
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'closed';
      default:
        return 'unknown';
    }
  }

  // ========================================================================
  // Incident Analysis (NEW)
  // ========================================================================

  async submitIncident(incidentText: string): Promise<any> {
    return this.request('POST', '/incidents/analyze', {
      incident_text: incidentText,
    });
  }
}

export default CREEClient;
