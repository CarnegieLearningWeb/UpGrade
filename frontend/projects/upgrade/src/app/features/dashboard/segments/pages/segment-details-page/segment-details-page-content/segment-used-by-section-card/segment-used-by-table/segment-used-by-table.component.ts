import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../../../../../../../shared/shared.module';
import { SegmentsService } from '../../../../../../../../core/segments/segments.service';
import { Observable, combineLatest, map } from 'rxjs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { UsedByTableRow, USED_BY_TYPE } from '../../../../../../../../core/segments/store/segments.model';
import { CommonStatusIndicatorChipComponent } from '../../../../../../../../shared-standalone-component-lib/components';

@Component({
  selector: 'app-segment-used-by-table',
  templateUrl: './segment-used-by-table.component.html',
  styleUrl: './segment-used-by-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
    TranslateModule,
    RouterModule,
    SharedModule,
    MatProgressBarModule,
    CommonStatusIndicatorChipComponent,
  ],
})
export class SegmentUsedByTableComponent implements OnInit {
  displayedColumns: string[] = ['name', 'type', 'status', 'updatedAt'];
  dataSource$: Observable<UsedByTableRow[]>;
  isLoading$ = this.segmentsService.isLoadingSegments$;
  noDataRowText = 'segments.details.used-by.card.no-data-row.text';

  USED_BY_TRANSLATION_KEYS = {
    NAME: 'segments.global-name.text',
    TYPE: 'segments.global-type.text',
    STATUS: 'segments.global-status.text',
    UPDATED_AT: 'segments.global-updated-at.text',
  };

  experimentSegmentsInclusion$ = this.segmentsService.allExperimentSegmentsInclusion$;
  experimentSegmentsExclusion$ = this.segmentsService.allExperimentSegmentsExclusion$;
  featureFlagSegmentsInclusion$ = this.segmentsService.allFeatureFlagSegmentsInclusion$;
  featureFlagSegmentsExclusion$ = this.segmentsService.allFeatureFlagSegmentsExclusion$;
  selectedSegment$ = this.segmentsService.selectedSegment$;

  constructor(private segmentsService: SegmentsService) {}

  ngOnInit() {
    this.dataSource$ = combineLatest([
      this.selectedSegment$,
      this.experimentSegmentsInclusion$,
      this.experimentSegmentsExclusion$,
      this.featureFlagSegmentsInclusion$,
      this.featureFlagSegmentsExclusion$,
    ]).pipe(
      map(([segment, expInclusions, expExclusions, flagInclusions, flagExclusions]) => {
        if (!segment) return [];

        // Use Map to prevent duplicates with experimentId or featureFlagId as the key
        const usedByMap = new Map<string, UsedByTableRow>();

        // Process experiment segments
        this.processExperimentSegments(expInclusions, segment.id, usedByMap);
        this.processExperimentSegments(expExclusions, segment.id, usedByMap);

        // Process feature flag segments
        this.processFeatureFlagSegments(flagInclusions, segment.id, usedByMap);
        this.processFeatureFlagSegments(flagExclusions, segment.id, usedByMap);

        // Convert Map values to array and sort by updatedAt (newest first)
        return Array.from(usedByMap.values()).sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      })
    );
  }

  private processExperimentSegments(segmentData: any[], segmentId: string, resultMap: Map<string, UsedByTableRow>) {
    if (!segmentData) return;

    segmentData.forEach((item) => {
      if (item.segment && item.segment.subSegments) {
        item.segment.subSegments.forEach((subSegment) => {
          if (subSegment.id === segmentId) {
            if (!resultMap.has(item.experimentId)) {
              resultMap.set(item.experimentId, {
                name: item.experiment.name,
                type: USED_BY_TYPE.EXPERIMENT,
                status: item.experiment.state,
                updatedAt: item.updatedAt,
                link: `/home/detail/${item.experimentId}`,
              });
            }
          }
        });
      }
    });
  }

  private processFeatureFlagSegments(segmentData: any[], segmentId: string, resultMap: Map<string, UsedByTableRow>) {
    if (!segmentData) return;

    segmentData.forEach((item) => {
      if (item.segment && item.segment.subSegments) {
        item.segment.subSegments.forEach((subSegment) => {
          if (subSegment.id === segmentId) {
            if (!resultMap.has(item.featureFlagId)) {
              resultMap.set(item.featureFlagId, {
                name: item.featureFlag.name,
                type: USED_BY_TYPE.FEATURE_FLAG,
                status: item.featureFlag.status,
                updatedAt: item.updatedAt,
                link: `/featureflags/detail/${item.featureFlagId}`,
              });
            }
          }
        });
      }
    });
  }
}
