import { Observable } from 'rxjs';

// common-import.types.ts
export interface ValidationResult {
  fileName: string;
  compatibilityType: 'compatible' | 'warning' | 'incompatible';
}

export interface ImportResult {
  fileName: string;
  error: string | null;
}

export interface ImportServiceAdapter {
  validateFiles(files: any[], params?: any): Observable<ValidationResult[]>;
  importFiles(files: any[], params?: any): Observable<ImportResult[]>;
  getLoadingState(): Observable<boolean>;
  setLoadingState(isLoading: boolean): void;
  fetchData?(reload?: boolean): void; // Optional method to refresh data after import
}

export enum ImportType {
  FEATURE_FLAG = 'featureFlag',
  SEGMENT = 'segment',
  LIST = 'list',
}

export interface ImportModalConfig {
  importType: ImportType;
  messageKey?: string; // Translation key for import message
  warningMessageKey?: string; // Translation key for warning message
  incompatibleMessageKey?: string; // Translation key for incompatible message
}
