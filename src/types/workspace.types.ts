import type { ServiceType } from './common.types.js';

export interface DirectoryNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  extension?: string;
  children?: DirectoryNode[];
}

export interface WorkspaceStructure {
  root: string;
  totalFiles: number;
  totalDirs: number;
  tree: DirectoryNode;
}

export interface ServiceInfo {
  name: string;
  path: string;
  type: ServiceType;
  detectedBy: string[];
  framework?: string;
  language?: string;
  hasDocker: boolean;
  hasPrisma: boolean;
  hasTests: boolean;
}

export interface SearchMatch {
  file: string;
  line: number;
  column: number;
  match: string;
  context?: string;
}

export interface SearchResult {
  query: string;
  matches: SearchMatch[];
  totalMatches: number;
  truncated: boolean;
  searchDurationMs: number;
}

export interface FileContent {
  path: string;
  content: string;
  size: number;
  extension: string;
  lineCount: number;
  truncated: boolean;
}

export interface ProjectSummary {
  name: string;
  root: string;
  services: ServiceInfo[];
  totalFiles: number;
  languages: string[];
  frameworks: string[];
  hasMonorepo: boolean;
  hasDatabases: boolean;
  hasDocker: boolean;
}
