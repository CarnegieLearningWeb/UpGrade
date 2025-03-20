import { Injectable, InjectionToken, Provider } from '@angular/core';
import { Observable } from 'rxjs';
import { FeatureFlagsDataService } from '../../../core/feature-flags/feature-flags.data.service';
import { FeatureFlagsService } from '../../../core/feature-flags/feature-flags.service';
import { ImportServiceAdapter, ValidationResult, ImportResult } from './common-import.types';
import { SegmentsService } from '../../../core/segments/segments.service';
import { SegmentsDataService } from '../../../core/segments/segments.data.service';
import { SegmentFile } from '../../../core/segments/store/segments.model';

@Injectable({ providedIn: 'root' })
export class FeatureFlagImportAdapter implements ImportServiceAdapter {
  constructor(
    private featureFlagsDataService: FeatureFlagsDataService,
    private featureFlagsService: FeatureFlagsService
  ) {}

  validateFiles(files: any[]): Observable<ValidationResult[]> {
    return this.featureFlagsDataService.validateFeatureFlag({ files }) as Observable<ValidationResult[]>;
  }

  importFiles(files: any[]): Observable<ImportResult[]> {
    return this.featureFlagsDataService.importFeatureFlag({ files }) as Observable<ImportResult[]>;
  }

  getLoadingState(): Observable<boolean> {
    return this.featureFlagsService.isLoadingImportFeatureFlag$;
  }

  setLoadingState(isLoading: boolean): void {
    this.featureFlagsService.setIsLoadingImportFeatureFlag(isLoading);
  }

  fetchData(reload = true): void {
    this.featureFlagsService.fetchFeatureFlags(reload);
  }
}

@Injectable({ providedIn: 'root' })
export class SegmentImportAdapter implements ImportServiceAdapter {
  constructor(private segmentDataService: SegmentsDataService, private segmentService: SegmentsService) {}

  validateFiles(files: SegmentFile[]): Observable<ValidationResult[]> {
    return this.segmentDataService.validateSegmentsImport(files) as Observable<ValidationResult[]>;
  }

  importFiles(files: SegmentFile[]): Observable<ImportResult[]> {
    return this.segmentDataService.importSegments(files) as Observable<ImportResult[]>;
  }

  getLoadingState(): Observable<boolean> {
    return this.segmentService.isLoadingSegments$;
  }

  setLoadingState(isLoading: boolean): void {
    this.segmentService.setIsLoadingImportSegment(isLoading);
  }

  fetchData(reload = true): void {
    this.segmentService.fetchSegments(reload);
  }
}

@Injectable({ providedIn: 'root' })
export class ListImportAdapter implements ImportServiceAdapter {
  constructor(
    private featureFlagsDataService: FeatureFlagsDataService,
    private featureFlagsService: FeatureFlagsService
  ) {}

  validateFiles(files: any[], params?: any): Observable<ValidationResult[]> {
    return this.featureFlagsDataService.validateFeatureFlagList(files, params.flagId, params.listType) as Observable<
      ValidationResult[]
    >;
  }

  importFiles(files: any[], params?: any): Observable<ImportResult[]> {
    return this.featureFlagsDataService.importFeatureFlagList(files, params.flagId, params.listType) as Observable<
      ImportResult[]
    >;
  }

  getLoadingState(): Observable<boolean> {
    return this.featureFlagsService.isLoadingImportFeatureFlag$;
  }

  setLoadingState(isLoading: boolean): void {
    this.featureFlagsService.setIsLoadingImportFeatureFlag(isLoading);
  }

  fetchData(reload = true): void {
    this.featureFlagsService.fetchFeatureFlags(reload);
  }
}

export const FEATURE_FLAG_IMPORT_SERVICE = new InjectionToken<ImportServiceAdapter>('FEATURE_FLAG_IMPORT_SERVICE');
export const SEGMENT_IMPORT_SERVICE = new InjectionToken<ImportServiceAdapter>('SEGMENT_IMPORT_SERVICE');
export const LIST_IMPORT_SERVICE = new InjectionToken<ImportServiceAdapter>('LIST_IMPORT_SERVICE');

export function provideImportServiceTypeAdapters(): Provider[] {
  return [
    { provide: FEATURE_FLAG_IMPORT_SERVICE, useClass: FeatureFlagImportAdapter },
    { provide: SEGMENT_IMPORT_SERVICE, useClass: SegmentImportAdapter },
    { provide: LIST_IMPORT_SERVICE, useClass: ListImportAdapter },
  ];
}
