
import { AgentLog } from '../types';

type Listener = (logs: AgentLog[]) => void;

class AgentLoggerService {
  private logs: AgentLog[] = [];
  private listeners: Listener[] = [];

  constructor() {
    // Initial mock logs
    this.addLog('1', 'Orchestrator Agent initialized', 'info');
    this.addLog('2', 'HR Analytics Agent online', 'info');
    this.addLog('3', 'DataOps Agent online', 'info');
  }

  getLogs(): AgentLog[] {
    return [...this.logs].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  addLog(
    agentId: string, 
    message: string, 
    type: 'info' | 'action' | 'error' = 'info', 
    metadata?: any,
    correlationId?: string,
    durationMs?: number
  ) {
    const newLog: AgentLog = {
      id: Math.random().toString(36).substr(2, 9),
      agentId,
      message,
      timestamp: new Date(),
      type,
      metadata,
      correlationId,
      durationMs
    };
    
    // Keep max 100 logs
    this.logs = [newLog, ...this.logs].slice(0, 100);
    this.notifyListeners();
  }

  startTimer(label: string): number {
    return performance.now();
  }

  endTimer(startTime: number): number {
    return Math.round(performance.now() - startTime);
  }

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    listener(this.getLogs()); // Initial emit
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    const logs = this.getLogs();
    this.listeners.forEach(l => l(logs));
  }

  clear() {
    this.logs = [];
    this.notifyListeners();
  }
}

export const agentLogger = new AgentLoggerService();
