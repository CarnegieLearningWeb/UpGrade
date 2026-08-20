import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CommonDetailsPageHeaderComponent,
  CommonPageComponent,
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardListComponent,
  CommonSectionCardOverviewDetailsComponent,
  CommonSectionCardSearchHeaderComponent,
  CommonSectionCardTitleHeaderComponent,
} from '@shared-component-lib';
import { KeyValueFormat } from '@shared-component-lib/common-section-card-overview-details/common-section-card-overview-details.component';
import { CommonSearchWidgetSearchParams } from '@shared-component-lib/common-section-card-search-header/common-section-card-search-header.component';
import { finalize, forkJoin, Subscription } from 'rxjs';
import { IMenuButtonItem, LIST_FILTER_MODE, SEGMENT_TYPE } from 'upgrade_types';
import { AuthService } from '../../../../../core/auth/auth.service';
import { NotificationService } from '../../../../../core/core.module';
import { ListDetailsDataService } from '../../../../../core/segments/list-details.data.service';
import {
  EditPrivateSegmentListDetails,
  LIST_OPTION_TYPE,
  LIST_OWNER_TYPE,
  ListDetailsOwner,
  ParticipantListTableRow,
  Segment,
} from '../../../../../core/segments/store/segments.model';
import { CommonExportHelpersService } from '../../../../../shared/services/common-export-helpers.service';
import { DialogService } from '../../../../../shared/services/common-dialog.service';
import {
  CommonModalConfig,
  ModalSize,
  SimpleConfirmationModalParams,
} from '@shared-component-lib/common-modal/common-modal.types';
import { MAX_LIST_VALUES, mergeUniqueListValues } from '../../../../../core/segments/list-values.utils';
import {
  LIST_VALUES_UPDATE_MODE,
  UpsertListValuesModalComponent,
  UpsertListValuesModalResult,
} from '../../modals/upsert-list-values-modal/upsert-list-values-modal.component';
import { EditListValueModalComponent } from '../../modals/edit-list-value-modal/edit-list-value-modal.component';

interface ListValueTableRow {
  index: number;
  value: string;
}

enum LIST_DETAILS_ACTION {
  EDIT = 'edit',
  DELETE = 'delete',
  IMPORT = 'import',
  EXPORT = 'export',
}

@Component({
  selector: 'app-list-details-page',
  imports: [
    CommonModule,
    CommonPageComponent,
    CommonDetailsPageHeaderComponent,
    CommonSectionCardComponent,
    CommonSectionCardListComponent,
    CommonSectionCardOverviewDetailsComponent,
    CommonSectionCardSearchHeaderComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule,
  ],
  templateUrl: './list-details-page.component.html',
  styleUrl: './list-details-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListDetailsPageComponent implements OnInit, OnDestroy {
  readonly displayedColumns = ['value', 'actions'];
  readonly dataSource = new MatTableDataSource<ListValueTableRow>([]);
  ownerType: LIST_OWNER_TYPE;
  ownerId = '';
  listId = '';
  filterMode = LIST_FILTER_MODE.EXCLUSION;
  owner: ListDetailsOwner;
  list: Segment;
  listType = '';
  listEnabled = true;
  values: string[] = [];
  valuesSearchString = '';
  metadataMenuButtonItems: IMenuButtonItem[] = [];
  valuesMenuButtonItems: IMenuButtonItem[] = [];
  showMetadataMenuButton = false;
  isValuesMenuDisabled = true;
  isLoading = true;
  isSaving = false;
  canManage = false;
  canDelete = false;
  areSectionCardsExpanded = true;
  isValuesSectionExpanded = true;

  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private listDetailsDataService: ListDetailsDataService,
    private dialog: MatDialog,
    private dialogService: DialogService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private commonExportHelpersService: CommonExportHelpersService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.dataSource.filterPredicate = (row, filter) => row.value.toLowerCase().includes(filter);
  }

  ngOnInit(): void {
    this.ownerType = this.route.snapshot.data['listOwnerType'];
    this.ownerId = this.getOwnerId();
    this.listId = this.route.snapshot.paramMap.get('listId') ?? '';
    this.filterMode =
      (this.route.snapshot.paramMap.get('filterMode') as LIST_FILTER_MODE) ?? LIST_FILTER_MODE.EXCLUSION;

    this.subscriptions.add(
      this.authService.userPermissions$.subscribe((permissions) => {
        this.canManage = !!permissions?.[this.permissionKey]?.update;
        this.canDelete = !!permissions?.[this.permissionKey]?.delete;
        this.updateMetadataMenuButtonItems();
        this.updateValuesMenuButtonItems();
        this.changeDetectorRef.markForCheck();
      })
    );

    this.loadDetails();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get rootName(): string {
    switch (this.ownerType) {
      case LIST_OWNER_TYPE.EXPERIMENT:
        return 'Experiments';
      case LIST_OWNER_TYPE.FEATURE_FLAG:
        return 'Feature Flags';
      default:
        return 'Segments';
    }
  }

  get rootLink(): string {
    switch (this.ownerType) {
      case LIST_OWNER_TYPE.EXPERIMENT:
        return 'home';
      case LIST_OWNER_TYPE.FEATURE_FLAG:
        return 'featureflags';
      default:
        return 'segments';
    }
  }

  get parentLink(): any[] {
    return ['/', this.rootLink, 'detail', this.ownerId];
  }

  get listSummarySubtitle(): string {
    const filterLabel = this.filterMode === LIST_FILTER_MODE.INCLUSION ? 'Include' : 'Exclude';
    const typeLabel =
      this.listType.toLowerCase() === LIST_OPTION_TYPE.INDIVIDUAL.toLowerCase()
        ? LIST_OPTION_TYPE.INDIVIDUAL
        : `Group: ${this.listType}`;
    return `${filterLabel} · ${typeLabel}`;
  }

  get listOverviewDetails(): KeyValueFormat {
    return {
      Description: this.list.description ?? '',
    };
  }

  get permissionKey(): 'experiments' | 'featureFlags' | 'segments' {
    switch (this.ownerType) {
      case LIST_OWNER_TYPE.EXPERIMENT:
        return 'experiments';
      case LIST_OWNER_TYPE.FEATURE_FLAG:
        return 'featureFlags';
      default:
        return 'segments';
    }
  }

  loadDetails(): void {
    if (!this.ownerId || !this.listId) {
      return;
    }

    this.isLoading = true;
    this.subscriptions.add(
      forkJoin({
        list: this.listDetailsDataService.fetchList(this.listId),
        owner: this.listDetailsDataService.fetchOwner(this.ownerType, this.ownerId, this.filterMode, this.listId),
      })
        .pipe(
          finalize(() => {
            this.isLoading = false;
            this.changeDetectorRef.markForCheck();
          })
        )
        .subscribe({
          next: ({ list, owner }) => {
            this.list = list;
            this.owner = owner;
            this.listType = list.listType ?? '';
            this.listEnabled = owner.listEnabled ?? this.filterMode === LIST_FILTER_MODE.EXCLUSION;
            this.setValues(this.determineValues(list));
            this.updateMetadataMenuButtonItems();
            this.changeDetectorRef.markForCheck();
          },
          error: () => {
            this.notificationService.showError('Unable to load list details.');
            this.changeDetectorRef.markForCheck();
          },
        })
    );
  }

  search(searchParams: CommonSearchWidgetSearchParams<string>): void {
    this.valuesSearchString = searchParams.searchString;
    this.dataSource.filter = this.valuesSearchString.trim().toLowerCase();
  }

  openAddValuesModal(): void {
    const dialogRef = this.dialog.open(UpsertListValuesModalComponent, {
      data: { importOnly: false, existingValues: this.values },
      width: ModalSize.STANDARD,
      autoFocus: 'textarea',
      disableClose: true,
    });
    this.subscriptions.add(dialogRef.afterClosed().subscribe((result) => this.applyValuesResult(result)));
  }

  openImportValuesModal(): void {
    const dialogRef = this.dialog.open(UpsertListValuesModalComponent, {
      data: { importOnly: true, existingValues: this.values },
      width: ModalSize.STANDARD,
      autoFocus: '.choose-file-btn',
      disableClose: true,
    });
    this.subscriptions.add(dialogRef.afterClosed().subscribe((result) => this.applyValuesResult(result)));
  }

  exportValues(): void {
    this.commonExportHelpersService.downloadValuesAsCSV(this.values, this.list.name || 'list-values');
  }

  onMetadataAction(action: string): void {
    if (action === LIST_DETAILS_ACTION.EDIT) {
      this.editMetadata();
    } else if (action === LIST_DETAILS_ACTION.DELETE) {
      this.deleteList();
    }
  }

  onOverviewSectionExpandChange(isExpanded: boolean): void {
    this.areSectionCardsExpanded = isExpanded;
    this.isValuesSectionExpanded = isExpanded;
  }

  onValuesMenuAction(action: string): void {
    if (action === LIST_DETAILS_ACTION.IMPORT) {
      this.openImportValuesModal();
    } else if (action === LIST_DETAILS_ACTION.EXPORT) {
      this.exportValues();
    }
  }

  onValuesSectionExpandChange(isExpanded: boolean): void {
    this.isValuesSectionExpanded = isExpanded;
  }

  editValue(row: ListValueTableRow): void {
    const dialogRef = this.dialog.open(EditListValueModalComponent, {
      data: { value: row.value, existingValues: this.values },
      width: ModalSize.SMALL,
      autoFocus: 'input',
      disableClose: true,
    });
    this.subscriptions.add(
      dialogRef.afterClosed().subscribe((value) => {
        if (!value) {
          return;
        }
        const nextValues = [...this.values];
        nextValues[row.index] = value;
        this.saveValues(nextValues, 'Value updated.');
      })
    );
  }

  deleteValue(row: ListValueTableRow): void {
    const config: CommonModalConfig<SimpleConfirmationModalParams> = {
      title: 'Delete Value',
      primaryActionBtnLabel: 'Delete',
      primaryActionBtnColor: 'warn',
      cancelBtnLabel: 'Cancel',
      params: { message: `Are you sure you want to delete "${row.value}"?` },
    };
    const dialogRef = this.dialogService.openSimpleCommonConfirmationModal(config, ModalSize.SMALL);
    this.subscriptions.add(
      dialogRef.afterClosed().subscribe((confirmed) => {
        if (confirmed) {
          this.saveValues(
            this.values.filter((_, index) => index !== row.index),
            'Value deleted.'
          );
        }
      })
    );
  }

  editMetadata(): void {
    const sourceList: ParticipantListTableRow = {
      listType: this.listType,
      segment: this.list,
      enabled: this.listEnabled,
    };
    let dialogRef;

    if (this.ownerType === LIST_OWNER_TYPE.EXPERIMENT) {
      dialogRef =
        this.filterMode === LIST_FILTER_MODE.INCLUSION
          ? this.dialogService.openExperimentEditIncludeListModal(sourceList, this.list.context, this.ownerId)
          : this.dialogService.openExperimentEditExcludeListModal(sourceList, this.list.context, this.ownerId);
    } else if (this.ownerType === LIST_OWNER_TYPE.FEATURE_FLAG) {
      dialogRef =
        this.filterMode === LIST_FILTER_MODE.INCLUSION
          ? this.dialogService.openFeatureFlagEditIncludeListModal(sourceList, this.list.context, this.ownerId)
          : this.dialogService.openFeatureFlagEditExcludeListModal(sourceList, this.list.context, this.ownerId);
    } else {
      dialogRef = this.dialogService.openEditListModal(
        sourceList,
        this.list.context,
        this.ownerId,
        this.owner.segmentType
      );
    }

    this.subscriptions.add(dialogRef.afterClosed().subscribe(() => this.loadDetails()));
  }

  deleteList(): void {
    let dialogRef;
    if (this.ownerType === LIST_OWNER_TYPE.EXPERIMENT || this.ownerType === LIST_OWNER_TYPE.FEATURE_FLAG) {
      dialogRef =
        this.filterMode === LIST_FILTER_MODE.INCLUSION
          ? this.dialogService.openDeleteIncludeListModal(this.list.name)
          : this.dialogService.openDeleteExcludeListModal(this.list.name);
    } else {
      dialogRef = this.dialogService.openDeleteListModal(this.list.name, this.owner.segmentType);
    }

    this.subscriptions.add(
      dialogRef.afterClosed().subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.isSaving = true;
        this.subscriptions.add(
          this.listDetailsDataService.deleteList(this.ownerType, this.filterMode, this.ownerId, this.listId).subscribe({
            next: () => {
              this.notificationService.showSuccess('List deleted.');
              this.router.navigate(this.parentLink);
            },
            error: () => {
              this.isSaving = false;
              this.notificationService.showError('Unable to delete list.');
              this.changeDetectorRef.markForCheck();
            },
          })
        );
      })
    );
  }

  private getOwnerId(): string {
    switch (this.ownerType) {
      case LIST_OWNER_TYPE.EXPERIMENT:
        return this.route.snapshot.paramMap.get('experimentId') ?? '';
      case LIST_OWNER_TYPE.FEATURE_FLAG:
        return this.route.snapshot.paramMap.get('flagId') ?? '';
      default:
        return this.route.snapshot.paramMap.get('segmentId') ?? '';
    }
  }

  private updateMetadataMenuButtonItems(): void {
    const actionTarget = this.getMetadataActionTarget();
    this.metadataMenuButtonItems = [
      {
        action: LIST_DETAILS_ACTION.EDIT,
        disabled: !this.canManage,
        label: `Edit ${actionTarget}`,
      },
      {
        action: LIST_DETAILS_ACTION.DELETE,
        disabled: !this.canDelete,
        label: `Delete ${actionTarget}`,
      },
    ];
    this.showMetadataMenuButton = this.metadataMenuButtonItems.some((item) => !item.disabled);
  }

  private getMetadataActionTarget(): string {
    if (this.ownerType === LIST_OWNER_TYPE.SEGMENT && this.owner?.segmentType !== SEGMENT_TYPE.GLOBAL_EXCLUDE) {
      return 'List';
    }
    return this.filterMode === LIST_FILTER_MODE.INCLUSION ? 'Include List' : 'Exclude List';
  }

  private determineValues(list: Segment): string[] {
    if (this.listType.toLowerCase() === LIST_OPTION_TYPE.INDIVIDUAL.toLowerCase()) {
      return list.individualForSegment?.map((individual) => individual.userId) ?? [];
    }
    return list.groupForSegment?.map((group) => group.groupId) ?? [];
  }

  private setValues(values: string[]): void {
    this.values = values;
    this.dataSource.data = values.map((value, index) => ({ value, index }));
    this.updateValuesMenuButtonItems();
  }

  private updateValuesMenuButtonItems(): void {
    this.valuesMenuButtonItems = [
      {
        label: 'Import CSV',
        action: LIST_DETAILS_ACTION.IMPORT,
        disabled: !this.canManage,
        preserveCase: true,
      },
      {
        label: 'Export CSV',
        action: LIST_DETAILS_ACTION.EXPORT,
        disabled: !this.values.length,
        preserveCase: true,
      },
    ];
    this.isValuesMenuDisabled = this.valuesMenuButtonItems.every((item) => item.disabled);
  }

  private applyValuesResult(result?: UpsertListValuesModalResult): void {
    if (!result) {
      return;
    }

    const mergeResult =
      result.mode === LIST_VALUES_UPDATE_MODE.REPLACE
        ? mergeUniqueListValues([], result.values)
        : mergeUniqueListValues(this.values, result.values);

    if (mergeResult.values.length > MAX_LIST_VALUES) {
      this.notificationService.showError(`A list can contain up to ${MAX_LIST_VALUES.toLocaleString()} values.`);
      return;
    }

    if (!mergeResult.addedValues.length && result.mode === LIST_VALUES_UPDATE_MODE.APPEND) {
      this.notificationService.showInfo(this.getAddedValuesMessage(0, mergeResult.duplicateValues.length));
      return;
    }

    if (result.mode === LIST_VALUES_UPDATE_MODE.REPLACE) {
      this.saveValues(
        mergeResult.values,
        this.getReplacedValuesMessage(mergeResult.values.length, mergeResult.duplicateValues.length)
      );
      return;
    }

    this.saveValues(
      mergeResult.values,
      this.getAddedValuesMessage(mergeResult.addedValues.length, mergeResult.duplicateValues.length)
    );
  }

  private getAddedValuesMessage(addedCount: number, duplicateCount: number): string {
    const addedMessage = addedCount
      ? `Added ${addedCount.toLocaleString()} ${addedCount === 1 ? 'value' : 'values'}.`
      : 'No values were added.';
    return `${addedMessage}${this.getDuplicatesSkippedMessage(duplicateCount)}`;
  }

  private getReplacedValuesMessage(valueCount: number, duplicateCount: number): string {
    const replacedMessage = `Replaced the list with ${valueCount.toLocaleString()} ${
      valueCount === 1 ? 'value' : 'values'
    }.`;
    return `${replacedMessage}${this.getDuplicatesSkippedMessage(duplicateCount)}`;
  }

  private getDuplicatesSkippedMessage(duplicateCount: number): string {
    if (!duplicateCount) {
      return '';
    }
    return ` ${duplicateCount.toLocaleString()} ${duplicateCount === 1 ? 'duplicate was' : 'duplicates were'} skipped.`;
  }

  private saveValues(values: string[], successMessage: string): void {
    if (this.isSaving) {
      return;
    }

    const segment: EditPrivateSegmentListDetails = {
      id: this.list.id,
      name: this.list.name,
      description: this.list.description ?? '',
      context: this.list.context,
      type: SEGMENT_TYPE.PRIVATE,
      userIds: this.listType.toLowerCase() === LIST_OPTION_TYPE.INDIVIDUAL.toLowerCase() ? values : [],
      groups:
        this.listType.toLowerCase() === LIST_OPTION_TYPE.INDIVIDUAL.toLowerCase()
          ? []
          : values.map((groupId) => ({ groupId, type: this.listType })),
      subSegmentIds: [],
      listType: this.listType,
    };

    this.isSaving = true;
    this.listDetailsDataService
      .updateList(this.ownerType, this.filterMode, this.ownerId, this.listEnabled, this.listType, segment)
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.changeDetectorRef.markForCheck();
        })
      )
      .subscribe({
        next: (updatedList) => {
          this.list = { ...this.list, ...updatedList, listType: this.listType };
          this.setValues(values);
          this.notificationService.showSuccess(successMessage);
          this.changeDetectorRef.markForCheck();
        },
        error: () => this.notificationService.showError('Unable to update list values.'),
      });
  }
}
