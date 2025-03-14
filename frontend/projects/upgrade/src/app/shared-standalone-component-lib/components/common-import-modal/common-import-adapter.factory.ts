import { Injectable } from '@angular/core';
import { FeatureFlagImportAdapter, SegmentImportAdapter, ListImportAdapter } from './common-import-type-adapters';
import { ImportType, ImportServiceAdapter } from './common-import.types';

@Injectable({ providedIn: 'root' })
export class ImportServiceFactory {
  constructor(
    private featureFlagAdapter: FeatureFlagImportAdapter,
    private segmentAdapter: SegmentImportAdapter,
    private listAdapter: ListImportAdapter
  ) {}

  getAdapter(type: ImportType): ImportServiceAdapter {
    switch (type) {
      case ImportType.FEATURE_FLAG:
        return this.featureFlagAdapter;
      case ImportType.SEGMENT:
        return this.segmentAdapter;
      case ImportType.LIST:
        return this.listAdapter;
      default:
        throw new Error(`Unknown import type: ${type}`);
    }
  }
}
