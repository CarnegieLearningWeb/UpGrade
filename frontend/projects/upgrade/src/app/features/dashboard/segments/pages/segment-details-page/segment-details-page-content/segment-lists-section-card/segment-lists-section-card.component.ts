import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
  CommonSectionCardActionButtonsComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { IMenuButtonItem } from 'upgrade_types';
import { SegmentsService } from '../../../../../../../core/segments/segments.service';
import { DialogService } from '../../../../../../../shared/services/common-dialog.service';
import { Segment } from '../../../../../../../core/segments/store/segments.model';
import { Observable } from 'rxjs';
import { AuthService } from '../../../../../../../core/auth/auth.service';
import { UserPermission } from '../../../../../../../core/auth/store/auth.models';
import { ParticipantListRowActionEvent } from '../../../../../../../core/feature-flags/store/feature-flags.model';

@Component({
  selector: 'app-segment-lists-section-card',
  standalone: true,
  imports: [
    CommonModule,
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    TranslateModule,
  ],
  templateUrl: './segment-lists-section-card.component.html',
  styleUrl: './segment-lists-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentListsSectionCardComponent {
  @Input() data: Segment;
  @Input() isSectionCardExpanded: boolean;
  permissions$: Observable<UserPermission>;
  tableRowCount$ = this.segmentsService.selectSegmentListsLength$;
  selectedSegment$ = this.segmentsService.selectedSegment$;

  menuButtonItems: IMenuButtonItem[] = [
    { name: 'Import List', disabled: false },
    { name: 'Export All Lists', disabled: false },
  ];

  constructor(
    private segmentsService: SegmentsService,
    private dialogService: DialogService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
  }

  onAddListClick(appContext: string, segmentId: string) {
    // this.dialogService.openAddListModal(appContext, segmentId);
  }

  onMenuButtonItemClick(event, segment: Segment) {
    switch (event) {
      case 'Import List':
        console.log('Import List');
        break;
      case 'Export All Lists':
        console.log('Export All Lists');
        break;
      default:
        console.log('Unknown action');
    }
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean) {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }

  onRowAction(event: ParticipantListRowActionEvent, segmentId: string): void {
    // This will be implemented later when we implement the table component
    console.log('Row action', event, segmentId);
  }
}
