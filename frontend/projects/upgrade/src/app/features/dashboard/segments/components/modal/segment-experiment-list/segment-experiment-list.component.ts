import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { Subscription } from 'rxjs';
import { SegmentsService } from '../../../../../../core/segments/segments.service';
import { ExperimentStatePipeType } from '../../../../../../shared/pipes/experiment-state.pipe';
import { EXPERIMENT_STATE } from '../../../../../../core/experiments/store/experiments.model';
@Component({
  selector: 'app-segment-experiment-list',
  templateUrl: './segment-experiment-list.component.html',
  styleUrls: ['./segment-experiment-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentExperimentListComponent implements OnInit {
  segmentExperimentListDisplayedColumns = ['experimentName', 'experimentState', 'experimentContext', 'usedList'];
  segment: any;
  allExperimentSegmentsInclusionSub: Subscription;
  allExperimentSegmentsExclusionSub: Subscription;
  allExperimentSegmentsInclusion = [];
  allExperimentSegmentsExclusion = [];
  segmentsExperimentList = [];

  constructor(
    private segmentsService: SegmentsService,
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

    if (this.allExperimentSegmentsInclusion) {
      this.allExperimentSegmentsInclusion.forEach((ele) => {
        const subSegments = ele.segment.subSegments;
        subSegments.forEach((subSegment) => {
          if (subSegment.id === this.segment.id) {
            this.segmentsExperimentList.push({
              experimentName: ele.experiment.name,
              experimentState: ele.experiment.state,
              experimentContext: ele.experiment.context,
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
              experimentState: ele.experiment.state,
              experimentContext: ele.experiment.context,
              usedList: 'Exclusion',
            });
          }
        });
      });
    }
  }
}
