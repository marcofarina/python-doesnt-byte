export type RunStatus = 'idle' | 'running' | 'done' | 'error';

export interface LogEntry {
  kind: 'stdout' | 'stderr';
  text: string;
}
