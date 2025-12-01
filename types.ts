
export enum Page {
  OVERVIEW = 'overview',
  DATA_STUDIO = 'data_studio',
  AGENT_CONSOLE = 'agent_console'
}

export enum IngestionStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  VALIDATING = 'VALIDATING',
  PARSING = 'PARSING',
  CHUNKING = 'CHUNKING',
  EMBEDDING = 'EMBEDDING',
  ANALYZING = 'ANALYZING',
  INDEXING = 'INDEXING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export type CorrelationId = string;

export interface SchemaColumn {
  name: string;
  type: string; // 'string' | 'number' | 'date' | 'boolean'
  example: string | number;
}

export interface DatasetVersion {
  version: number;
  timestamp: Date;
  changeDescription: string;
  rowCount: number;
  modificationsCount?: number;
}

// Full dataset model
export interface ActiveDataset {
  id: string;
  fileName: string;
  rows: any[]; // The actual data
  columns: SchemaColumn[];
  version: number;
  versionHash: string; // Atomic integrity check
  history: DatasetVersion[];
  lastModified: Date;
  isModified?: boolean; // Track unsaved changes
  uploadedAt?: Date;
}

export interface DatasetListItem {
  id: string;
  name: string;
  rows: number;
  version: number;
  uploadedAt: Date;
  active: boolean;
}

export interface SourceCitation {
  fileName: string;
  chunkId?: string;
  snippet?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: SourceCitation[];
  timestamp: number;
  isThinking?: boolean;
}

export interface DashboardInsight {
  id: string;
  category: 'HR' | 'RISK' | 'BI' | 'GENERAL';
  title: string;
  summary: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  evidence?: { metric: string; value: string | number }[];
  actionable?: string;
  // Backwards compatibility
  tag?: string; 
  description?: string;
}

export interface IngestedFile {
  id: string;
  name: string;
  type: string;
  content: string;
  version: number;
  uploadDate: Date;
}

export interface FileSchema {
  fileName: string;
  rowCount: number;
  columns: SchemaColumn[];
}

// Agent Console Types
export interface AgentLog {
  id: string;
  agentId: string;
  message: string;
  timestamp: Date;
  type: 'info' | 'action' | 'error';
  metadata?: any;
  correlationId?: CorrelationId;
  durationMs?: number;
}

export interface AgentStatus {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'busy' | 'offline';
  uptime: string;
  lastActive: Date;
}

// Dashboard Config Types (Strict Contract)
export interface DashboardKPI {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  confidence?: number; // 0-1
  change?: string;
  icon?: string;
}

export interface DashboardChart {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'donut' | 'histogram' | 'scatter' | 'area';
  title: string;
  xLabel?: string;
  yLabel?: string;
  xField?: string; // Backwards compat
  yField?: string; // Backwards compat
  data?: any[];
  annotations?: any[];
}

export interface DashboardConfig {
  datasetId?: string;
  datasetVersionHash?: string;
  timestamp?: string;
  kpis: DashboardKPI[];
  charts: DashboardChart[];
  insights: DashboardInsight[];
  dataset_version: string; // Legacy string "vX"
  analyticsVersionHash?: string;
}

// --- DATAOPS TYPES ---

export enum DataOpsMode {
  EDIT_CELL = 'EDIT_CELL',
  ADD_ROW = 'ADD_ROW',
  DELETE_ROWS = 'DELETE_ROWS',
  CLEAN_NULLS = 'CLEAN_NULLS',
  FILL_NULLS = 'FILL_NULLS',
  DEDUPLICATE = 'DEDUPLICATE',
  NORMALIZE_DATES = 'NORMALIZE_DATES',
  FILTER_ROWS = 'FILTER_ROWS',
  CREATE_DERIVED_COLUMN = 'CREATE_DERIVED_COLUMN',
  BULK_UPDATE = 'BULK_UPDATE',
  EXPORT = 'EXPORT'
}

export interface DataOpsRequest {
  mode: DataOpsMode;
  details?: any;
  rowIndex?: number;
  column?: string;
  value?: any;
  preview_only?: boolean;
  natural_language_instruction?: string;
  correlationId?: CorrelationId;
  datasetId?: string;
}

export interface DataOpsOperation {
  type: DataOpsMode;
  target?: any;
  params?: any;
  where?: any;
}

export interface TransformationPlan {
  operations: DataOpsOperation[];
  previewRows?: any[];
  estimatedRowsAffected?: number;
  dryRunSql?: string;
}

export interface DataOpsPreview {
  rows_sample?: any[];
  row_count_before?: number;
  row_count_after?: number;
}

export interface DataOpsResponse {
  plan: TransformationPlan;
  preview?: DataOpsPreview;
  summary: string;
  new_version?: string;
  updated_dataset?: ActiveDataset;
  export?: {
    format: "CSV" | "JSON" | "XLSX";
    columns?: string[];
    filters?: any[];
  };
}

export interface DatasetMetadata {
  datasetId: string;
  datasetVersion: string;
  schema: { name: string; type: string }[];
  rowCount?: number;
  [key: string]: any;
}
