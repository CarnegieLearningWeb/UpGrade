import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { SegmentsService_LEGACY } from '../../../../../../core/segments_LEGACY/segments.service._LEGACY';
import { ExperimentStatePipeType } from '../../../../../../shared/pipes/experiment-state.pipe';
import { EXPERIMENT_STATE } from '../../../../../../core/experiments/store/experiments.model';
@Component({
  selector: 'app-segment-experiment-list',
  templateUrl: './segment-experiment-list.component.html',
  styleUrls: ['./segment-experiment-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SegmentExperimentListComponent implements OnInit {
  segmentExperimentListDisplayedColumns = ['experimentName', 'type', 'experimentState', 'usedList'];
  segment: any;
  allExperimentSegmentsInclusionSub: Subscription;
  allExperimentSegmentsExclusionSub: Subscription;
  allFeatureFlagSegmentsInclusionSub: Subscription;
  allFeatureFlagSegmentsExclusionSub: Subscription;
  allExperimentSegmentsInclusion = [];
  allExperimentSegmentsExclusion = [];
  allFeatureFlagSegmentsInclusion = [];
  allFeatureFlagSegmentsExclusion = [];
  segmentsExperimentList = [];

  constructor(
    private segmentsService: SegmentsService_LEGACY,
    public dialogRef: MatDialogRef<SegmentExperimentListComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.segment = this.data.segment;
  }

  get ExperimentStatePipeTypes() {
    return ExperimentStatePipeType;
  }

  get ExperimentState() {
    return EXPERIMENT_STATE;
  }

  ngOnInit() {
    this.allExperimentSegmentsInclusionSub = this.segmentsService.allExperimentSegmentsInclusion$.subscribe((ele) => {
      this.allExperimentSegmentsInclusion = ele;
    });

    this.allExperimentSegmentsExclusionSub = this.segmentsService.allExperimentSegmentsExclusion$.subscribe((ele) => {
      this.allExperimentSegmentsExclusion = ele;
    });

    this.allFeatureFlagSegmentsInclusionSub = this.segmentsService.allFeatureFlagSegmentsInclusion$.subscribe((ele) => {
      this.allFeatureFlagSegmentsInclusion = ele;
    });

    this.allFeatureFlagSegmentsExclusionSub = this.segmentsService.allFeatureFlagSegmentsExclusion$.subscribe((ele) => {
      this.allFeatureFlagSegmentsExclusion = ele;
    });

    if (this.allExperimentSegmentsInclusion) {
      this.allExperimentSegmentsInclusion.forEach((ele) => {
        const subSegments = ele.segment.subSegments;
        subSegments.forEach((subSegment) => {
          if (subSegment.id === this.segment.id) {
            this.segmentsExperimentList.push({
              experimentName: ele.experiment.name,
              type: 'Experiment',
              experimentState: ele.experiment.state,
              usedList: 'Inclusion',
            });
          }
        });
      });
    }

    if (this.allExperimentSegmentsExclusion) {
      this.allExperimentSegmentsExclusion.forEach((ele) => {
        const subSegments = ele.segment.subSegments;
        subSegments.forEach((subSegment) => {
          if (subSegment.id === this.segment.id) {
            this.segmentsExperimentList.push({
              experimentName: ele.experiment.name,
              type: 'Experiment',
              experimentState: ele.experiment.state,
              usedList: 'Exclusion',
            });
          }
        });
      });
    }

    if (this.allFeatureFlagSegmentsInclusion) {
      this.allFeatureFlagSegmentsInclusion.forEach((ele) => {
        const subSegments = ele.segment.subSegments;
        subSegments.forEach((subSegment) => {
          if (subSegment.id === this.segment.id) {
            this.segmentsExperimentList.push({
              experimentName: ele.featureFlag.name,
              type: 'Feature Flag',
              experimentState: ele.featureFlag.status,
              usedList: 'Inclusion',
            });
          }
        });
      });
    }

    if (this.allFeatureFlagSegmentsExclusion) {
      this.allFeatureFlagSegmentsExclusion.forEach((ele) => {
        const subSegments = ele.segment.subSegments;
        subSegments.forEach((subSegment) => {
          if (subSegment.id === this.segment.id) {
            this.segmentsExperimentList.push({
              experimentName: ele.featureFlag.name,
              type: 'Feature Flag',
              experimentState: ele.featureFlag.status,
              usedList: 'Exclusion',
            });
          }
        });
      });
    }
  }
}
