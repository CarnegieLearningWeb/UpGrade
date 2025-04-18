import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  CommonSectionCardComponent,
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { SegmentsService } from '../../../../../../../core/segments/segments.service';
import { AsyncPipe, NgIf, TitleCasePipe } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { DialogService } from '../../../../../../../shared/services/common-dialog.service';
import { Observable, map } from 'rxjs';
import { Segment } from '../../../../../../../core/segments/store/segments.model';
import { UserPermission } from '../../../../../../../core/auth/store/auth.models';
import { AuthService } from '../../../../../../../core/auth/auth.service';
import {
  TableState,
  CommonTableHelpersService,
} from '../../../../../../../shared/services/common-table-helpers.service';
import { SegmentGlobalSectionCardTableComponent } from './segment-global-section-card-table/segment-global-section-card-table.component';

@Component({
  selector: 'app-segment-global-section-card',
  imports: [
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    SegmentGlobalSectionCardTableComponent,
    AsyncPipe,
    NgIf,
    MatProgressSpinnerModule,
    RouterModule,
    TranslateModule,
    TitleCasePipe,
  ],
  templateUrl: './segment-global-section-card.component.html',
  styleUrl: '../segment-root-section-card/segment-root-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentGlobalSectionCardComponent {
  permissions$: Observable<UserPermission>;
  dataSource$: Observable<MatTableDataSource<Segment>>;
  isLoadingGLobalSegments$ = this.segmentService.isLoadingGlobalSegments$;
  selectGlobalTableState$ = this.segmentService.selectGlobalTableState$;

  isSectionCardExpanded = false;

  constructor(
    private segmentService: SegmentsService,
    private translateService: TranslateService,
    private dialogService: DialogService,
    private authService: AuthService,
    private tableHelpersService: CommonTableHelpersService
  ) {}

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
    this.segmentService.fetchGlobalSegments(true);
  }

  ngAfterViewInit() {
    this.dataSource$ = this.selectGlobalTableState$.pipe(
      map((tableState: TableState<Segment>) => {
        return new MatTableDataSource(tableState.tableData);
      })
    );
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean) {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }
}
