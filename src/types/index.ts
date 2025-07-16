export interface PathMapping {
  [key: string]: string;
}

export interface PathMapperOptions {
  rootDir?: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  maxDepth?: number;
  autoGenerate?: boolean;
  validateExisting?: boolean;
}

export interface DiscoveredPath {
  alias: string;
  path: string;
  relativePath: string;
  type: 'directory' | 'file';
  depth: number;
}

export interface PathMapperResult {
  mappings: PathMapping;
  discovered: DiscoveredPath[];
  suggestions: string[];
  warnings: string[];
  errors: string[];
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  path?: string;
  suggestion?: string;
} 