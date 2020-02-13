import { Component, OnInit, ChangeDetectionStrategy, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GroupTypes } from '../../../../core/experiments/store/experiments.model';
import { ExperimentUsersService } from '../../../../core/experiment-users/experiment-users.service';
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';
import { ExcludeEntity, EntityTypes } from '../../../../core/experiment-users/store/experiment-users.model';
import { ExperimentUserValidators } from '../validator/experiment-users-validators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-root',
  templateUrl: './experiment-users-root.component.html',
  styleUrls: ['./experiment-users-root.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentUsersRootComponent implements OnInit, OnDestroy {
  displayedColumns = ['type', 'id', 'removeEntity'];
  allExcludedEntities: MatTableDataSource<ExcludeEntity>;
  allExcludedEntitiesSub: Subscription;

  excludeEntitiesForm: FormGroup;
  entityTypes = [
    { value: EntityTypes.USER_ID },
    { value: EntityTypes.GROUP_ID }
  ];
  groupTypes = [
    { value: GroupTypes.CLASS },
    { value: GroupTypes.DISTRICT },
    { value: GroupTypes.SCHOOL },
    { value: GroupTypes.OTHER }
  ];
  isEntityLoading$ = this.experimentUserService.isExcludedEntityLoading$;

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor(
    private _formBuilder: FormBuilder,
    private experimentUserService: ExperimentUsersService
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
    this.allExcludedEntities.paginator = this.paginator;
    this.allExcludedEntities.sort = this.sort;

    this.excludeEntitiesForm = this._formBuilder.group({
      entityType: [ EntityTypes.GROUP_ID , Validators.required],
      groupType: [GroupTypes.CLASS],
      id: [null, Validators.required],
      customGroupName: [null]
    }, { validators: ExperimentUserValidators.validateExcludedEntityForm });
  }

  excludeEntity() {
    const { entityType, id, groupType, customGroupName } = this.excludeEntitiesForm.value;
    this.excludeEntitiesForm.get('id').reset();
    this.excludeEntitiesForm.get('customGroupName').reset();
    switch (entityType) {
      case EntityTypes.USER_ID:
        this.experimentUserService.excludeUser(id);
        break;
      case EntityTypes.GROUP_ID:
        (groupType === GroupTypes.OTHER)
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

  ngOnDestroy() {
    this.allExcludedEntitiesSub.unsubscribe();
  }
}
