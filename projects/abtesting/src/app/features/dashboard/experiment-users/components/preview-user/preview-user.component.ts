import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ViewChild } from '@angular/core';
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { GroupTypes } from '../../../../../core/experiments/store/experiments.model';
import { PreviewUsersService } from '../../../../../core/preview-users/preview-users.service';
import { Subscription } from 'rxjs';
import { ExperimentUserValidators } from '../../validator/experiment-users-validators';

@Component({
  selector: 'users-preview-user',
  templateUrl: './preview-user.component.html',
  styleUrls: ['./preview-user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreviewUserComponent implements OnInit, OnDestroy {
  displayedColumns = ['id', 'type', 'removeEntity'];
  allPreviewUsers: any;
  allPreviewUsersSub: Subscription;
  isPreviewUserLoading$ = this.previewUserService.isPreviewUserLoading$;

  previewUsersForm: FormGroup;
  groupTypes = [
    { value: GroupTypes.CLASS },
    { value: GroupTypes.DISTRICT },
    { value: GroupTypes.SCHOOL },
    { value: GroupTypes.OTHER }
  ];

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor(
    private _formBuilder: FormBuilder,
    private previewUserService: PreviewUsersService
  ) {}

  ngOnInit() {
    this.previewUsersForm = this._formBuilder.group({
      id: [null, Validators.required],
      userGroups: this._formBuilder.array([this.getNewUserGroup()])
    });

    this.allPreviewUsersSub = this.previewUserService.allPreviewUsers$.subscribe(previewUsers => {
      this.allPreviewUsers = new MatTableDataSource();
      this.allPreviewUsers.data = previewUsers;
      this.allPreviewUsers.paginator = this.paginator;
      this.allPreviewUsers.sort = this.sort;
    });
  }

  getNewUserGroup() {
    return this._formBuilder.group({
      groupType: [GroupTypes.CLASS],
      customGroupName: [null],
      groupId: [null, Validators.required]
    }, { validators: ExperimentUserValidators.validatePreviewUserForm });
  }

  get userGroups(): FormArray {
    return this.previewUsersForm.get('userGroups') as FormArray;
  }

  addNewUserGroup() {
      this.userGroups.push(this.getNewUserGroup());
  }

  removeUserGroup(index: number) {
    this.userGroups.removeAt(index);
  }

  addPreviewUser() {
    const { id, userGroups } = this.previewUsersForm.value;
    const group = userGroups.reduce((acc, value) => {
      return value.groupType === GroupTypes.OTHER ? { ...acc, [value.customGroupName]: value.groupId } : { ...acc, [value.groupType]: value.groupId };
    }, {});
    this.previewUsersForm.get('id').reset();
    this.userGroups.clear();
    this.userGroups.push(this.getNewUserGroup());
    this.previewUserService.addPreviewUser(id, group);
  }

  removePreviewUser(previewUser: any) {
    this.previewUserService.deletePreviewUser(previewUser.id);
  }

  groupTypeValue(index: number) {
    return this.previewUsersForm.get('userGroups').value[index].groupType === GroupTypes.OTHER;
  }

  ngOnDestroy() {
    this.allPreviewUsersSub.unsubscribe();
  }
}
