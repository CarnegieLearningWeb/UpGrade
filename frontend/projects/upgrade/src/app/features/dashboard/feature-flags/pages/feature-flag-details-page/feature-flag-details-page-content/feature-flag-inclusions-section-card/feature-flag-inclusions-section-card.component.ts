import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { IMenuButtonItem, FILTER_MODE } from 'upgrade_types';
import { FeatureFlagInclusionsTableComponent } from './feature-flag-inclusions-table/feature-flag-inclusions-table.component';
import { FeatureFlagsService } from '../../../../../../../core/feature-flags/feature-flags.service';
import { DialogService } from '../../../../../../../shared/services/common-dialog.service';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatDialogRef } from '@angular/material/dialog';
import { CommonSimpleConfirmationModalComponent } from '../../../../../../../shared-standalone-component-lib/components/common-simple-confirmation-modal/common-simple-confirmation-modal.component';
import { Observable, Subscription, combineLatest, map } from 'rxjs';

@Component({
  selector: 'app-feature-flag-inclusions-section-card',
  standalone: true,
  imports: [
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    CommonModule,
    FeatureFlagInclusionsTableComponent,
    TranslateModule,
  ],
  templateUrl: './feature-flag-inclusions-section-card.component.html',
  styleUrl: './feature-flag-inclusions-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagInclusionsSectionCardComponent {
  @Input() isSectionCardExpanded;
  tableRowCount$ = this.featureFlagService.selectFeatureFlagInclusionsLength$;
  selectedFlag$ = this.featureFlagService.selectedFeatureFlag$;

  rowCountWithInclude$: Observable<number> = combineLatest([this.tableRowCount$, this.selectedFlag$]).pipe(
    map(([tableRowCount, selectedFeatureFlag]) =>
      selectedFeatureFlag?.filterMode === FILTER_MODE.INCLUDE_ALL ? 0 : tableRowCount
    )
  );

  get FILTER_MODE() {
    return FILTER_MODE;
  }

  constructor(private featureFlagService: FeatureFlagsService, private dialogService: DialogService) {}
  subscriptions = new Subscription();
  menuButtonItems: IMenuButtonItem[] = [
    { name: 'Edit', disabled: false },
    { name: 'Delete', disabled: false },
  ];

  confirmIncludeAllChangeDialogRef: MatDialogRef<CommonSimpleConfirmationModalComponent>;

  addIncludeListClicked(appContext: string) {
    this.dialogService.openAddIncludeListModal(appContext);
  }

  onSlideToggleChange(event: MatSlideToggleChange, flagId: string): void {
    const slideToggleEvent = event.source;
    const newFilterMode = slideToggleEvent.checked ? FILTER_MODE.INCLUDE_ALL : FILTER_MODE.EXCLUDE_ALL;
    if (slideToggleEvent.checked) {
      this.confirmIncludeAllChangeDialogRef = this.openEnableConfirmModel();
    } else {
      this.confirmIncludeAllChangeDialogRef = this.openDisableConfirmModal();
    }
    this.listenForConfirmIncludeAllChangeDialogRefClose(flagId, newFilterMode);
    slideToggleEvent.checked = !slideToggleEvent.checked;
  }

  openEnableConfirmModel(): MatDialogRef<CommonSimpleConfirmationModalComponent, boolean> {
    return this.dialogService.openEnableIncludeAllConfirmModel();
  }

  openDisableConfirmModal(): MatDialogRef<CommonSimpleConfirmationModalComponent, boolean> {
    return this.dialogService.openDisableIncludeAllConfirmModal();
  }

  listenForConfirmIncludeAllChangeDialogRefClose(flagId: string, newFilterMode: FILTER_MODE) {
    this.subscriptions.add(
      this.confirmIncludeAllChangeDialogRef.afterClosed().subscribe((confirmClicked) => {
        this.handleDialogClose(confirmClicked, flagId, newFilterMode);
      })
    );
  }

  handleDialogClose(confirmClicked: boolean, flagId: string, newFilterMode: FILTER_MODE): void {
    if (confirmClicked) {
      this.featureFlagService.updateFilterMode({
        flagId: flagId,
        filterMode: newFilterMode,
      });
      this.updateSectionCardExpansion(newFilterMode);
    }
  }

  updateSectionCardExpansion(newFilterMode: FILTER_MODE): void {
    this.isSectionCardExpanded = newFilterMode !== FILTER_MODE.INCLUDE_ALL;
  }

  onMenuButtonItemClick(event) {
    console.log('Menu button Clicked');
    console.log(event);
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean) {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
