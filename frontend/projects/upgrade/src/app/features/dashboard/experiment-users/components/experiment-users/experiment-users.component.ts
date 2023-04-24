import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ExcludeEntity, EntityTypes } from '../../../../../core/experiment-users/store/experiment-users.model';
import { Subscription, Observable } from 'rxjs';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { IContextMetaData } from '../../../../../core/experiments/store/experiments.model';
import { ExperimentUsersService } from '../../../../../core/experiment-users/experiment-users.service';
import { UserPermission } from '../../../../../core/auth/store/auth.models';
import { AuthService } from '../../../../../core/auth/auth.service';
import { UserRole } from 'upgrade_types';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { MatSort } from '@angular/material/sort';
import { MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';

@Component({
  selector: 'users-experiment-users',
  templateUrl: './experiment-users.component.html',
  styleUrls: ['./experiment-users.component.scss'],
})
export class ExperimentUsersComponent implements OnInit, OnDestroy {
  permissions$: Observable<UserPermission>;
  currentUser$ = this.authService.currentUser$;
  displayedColumns = ['type', 'id', 'removeEntity'];
  allExcludedEntities: MatTableDataSource<ExcludeEntity>;
  allExcludedEntitiesSub: Subscription;

  excludeEntitiesForm: UntypedFormGroup;
  entityTypes = [{ value: EntityTypes.PARTICIPANT_ID }, { value: EntityTypes.GROUP_ID }];
  groupTypes = new Set();
  groupTypeClass = 'class';
  isEntityLoading$ = this.experimentUserService.isExcludedEntityLoading$;

  contextMetaData: IContextMetaData | Record<string, unknown> = {};
  contextMetaDataSub: Subscription;
  contexts: string[];

  private paginator: MatPaginator;
  private sort: MatSort;

  @ViewChild(MatPaginator, { static: false }) set matPaginator(mp: MatPaginator) {
    this.paginator = mp;
    this.allExcludedEntities.paginator = this.paginator;
  }
  @ViewChild(MatSort, { static: false }) set matSort(ms: MatSort) {
    this.sort = ms;
    this.allExcludedEntities.sort = this.sort;
  }

  constructor(
    private _formBuilder: UntypedFormBuilder,
    private experimentUserService: ExperimentUsersService,
    private authService: AuthService,
    private experimentService: ExperimentService
  ) {
    this.allExcludedEntitiesSub = this.experimentUserService.allExcludedEntities$.subscribe((entities) => {
      this.allExcludedEntities = new MatTableDataSource();
      this.allExcludedEntities.data = entities;
      this.allExcludedEntities.paginator = this.paginator;
      this.allExcludedEntities.sort = this.sort;

      // Update angular material table's default sort
      this.allExcludedEntities.sortingDataAccessor = (data: any, property) => {
        if (property === 'id') {
          return data.type ? data.groupId : data.userId;
        } else {
          return data[property];
        }
      };
    });
  }

  ngOnInit() {
    this.experimentService.fetchContextMetaData();
    this.permissions$ = this.authService.userPermissions$;
    this.allExcludedEntities.paginator = this.paginator;
    this.allExcludedEntities.sort = this.sort;

    this.contextMetaDataSub = this.experimentService.contextMetaData$.subscribe((contextMetaData) => {
      this.contextMetaData = contextMetaData;
      if (contextMetaData.contextMetadata) {
        this.contexts = Object.keys(contextMetaData.contextMetadata) || [];
        this.contexts.forEach((context) => {
          this.contextMetaData.contextMetadata[context].GROUP_TYPES.forEach((group) => {
            this.groupTypes.add(group);
          });
        });
      } else {
        this.contexts = [];
      }
    });

    this.excludeEntitiesForm = this._formBuilder.group({
      entityType: [EntityTypes.GROUP_ID, Validators.required],
      groupType: [this.groupTypeClass],
      id: [null, Validators.required],
    });
  }

  excludeEntity() {
    const { entityType, id, groupType } = this.excludeEntitiesForm.value;
    this.excludeEntitiesForm.get('id').reset();
    switch (entityType) {
      case EntityTypes.PARTICIPANT_ID:
        this.experimentUserService.excludeUser(id);
        break;
      case EntityTypes.GROUP_ID:
        this.experimentUserService.excludeGroup(id, groupType);
        break;
    }
  }

  removeExcludedEntity(entity: ExcludeEntity) {
    entity.groupId
      ? this.experimentUserService.deleteExcludedGroup(entity.groupId, entity.type)
      : this.experimentUserService.deleteExcludedUser(entity.userId);
  }

  get entityTypeValue() {
    return this.excludeEntitiesForm.get('entityType').value === EntityTypes.GROUP_ID;
  }

  get groupTypeValue() {
    return this.excludeEntitiesForm.get('groupType').value === this.entityTypeValue;
  }

  get userRole() {
    return UserRole;
  }

  // For getting custom placeholder
  get getIdPlaceholder() {
    const { entityType, groupType } = this.excludeEntitiesForm.value;
    if (entityType === EntityTypes.PARTICIPANT_ID) {
      return 'Enter participant ID';
    } else {
      return 'Enter ' + groupType + ' ID';
    }
  }

  ngOnDestroy() {
    this.allExcludedEntitiesSub.unsubscribe();
    this.contextMetaDataSub.unsubscribe();
  }
}
