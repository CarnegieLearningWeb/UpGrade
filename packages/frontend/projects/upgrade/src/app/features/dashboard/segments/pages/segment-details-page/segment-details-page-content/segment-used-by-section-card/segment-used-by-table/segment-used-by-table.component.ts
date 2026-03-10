import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../../../../../../../shared/shared.module';
import { SegmentsService } from '../../../../../../../../core/segments/segments.service';
import { Observable } from 'rxjs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { UsedByTableRow } from '../../../../../../../../core/segments/store/segments.model';
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

  constructor(private segmentsService: SegmentsService) {}

  ngOnInit() {
    this.dataSource$ = this.segmentsService.segmentUsageData$;
  }
}
