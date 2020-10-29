import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatTableDataSource, MatPaginator, MatSort } from '@angular/material';
import { ExcludeEntity, EntityTypes } from '../../../../../core/experiment-users/store/experiment-users.model';
import { Subscription, Observable } from 'rxjs';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { GroupTypes } from '../../../../../core/experiments/store/experiments.model';
import { ExperimentUsersService } from '../../../../../core/experiment-users/experiment-users.service';
import { ExperimentUserValidators } from '../../validator/experiment-users-validators';
import { UserPermission } from '../../../../../core/auth/store/auth.models';
import { AuthService } from '../../../../../core/auth/auth.service';
import { UserRole } from 'upgrade_types';

@Component({
  selector: 'users-experiment-users',
  templateUrl: './experiment-users.component.html',
  styleUrls: ['./experiment-users.component.scss']
})
export class ExperimentUsersComponent implements OnInit, OnDestroy {
  permissions$: Observable<UserPermission>;
  currentUser$ = this.authService.currentUser$;
  displayedColumns = ['type', 'id', 'removeEntity'];
  allExcludedEntities: MatTableDataSource<ExcludeEntity>;
  allExcludedEntitiesSub: Subscription;

  excludeEntitiesForm: FormGroup;
  entityTypes = [{ value: EntityTypes.PARTICIPANT_ID }, { value: EntityTypes.GROUP_ID }];
  groupTypes = [
    { value: GroupTypes.CLASS },
    { value: GroupTypes.DISTRICT },
    { value: GroupTypes.SCHOOL },
    { value: GroupTypes.TEACHER },
    { value: GroupTypes.OTHER }
  ];
  isEntityLoading$ = this.experimentUserService.isExcludedEntityLoading$;

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
    private _formBuilder: FormBuilder,
    private experimentUserService: ExperimentUsersService,
    private authService: AuthService
  ) {
    this.allExcludedEntitiesSub = this.experimentUserService.allExcludedEntities$.subscribe(entities => {
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
    this.permissions$ = this.authService.userPermissions$;
    this.allExcludedEntities.paginator = this.paginator;
    this.allExcludedEntities.sort = this.sort;

    this.excludeEntitiesForm = this._formBuilder.group(
      {
        entityType: [EntityTypes.GROUP_ID, Validators.required],
        groupType: [GroupTypes.CLASS],
        id: [null, Validators.required],
        customGroupName: [null]
      },
      { validators: ExperimentUserValidators.validateExcludedEntityForm }
    );
  }

  excludeEntity() {
    const { entityType, id, groupType, customGroupName } = this.excludeEntitiesForm.value;
    this.excludeEntitiesForm.get('id').reset();
    this.excludeEntitiesForm.get('customGroupName').reset();
    switch (entityType) {
      case EntityTypes.PARTICIPANT_ID:
        this.experimentUserService.excludeUser(id);
        break;
      case EntityTypes.GROUP_ID:
        groupType === GroupTypes.OTHER
          ? this.experimentUserService.excludeGroup(id, customGroupName)
          : this.experimentUserService.excludeGroup(id, groupType);
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
    return this.excludeEntitiesForm.get('groupType').value === GroupTypes.OTHER && this.entityTypeValue;
  }

  get userRole() {
    return UserRole;
  }

  // For getting custom placeholder
  get getIdPlaceholder() {
    const { entityType, groupType, customGroupName } = this.excludeEntitiesForm.value;
    if (entityType === EntityTypes.PARTICIPANT_ID) {
      return 'Enter participant ID';
    } else {
      if (groupType === GroupTypes.OTHER) {
        return 'Enter ' + (customGroupName || '') + ' ID';
      } else {
        return 'Enter ' + groupType + ' ID';
      }
    }
  }

  ngOnDestroy() {
    this.allExcludedEntitiesSub.unsubscribe();
  }
}
