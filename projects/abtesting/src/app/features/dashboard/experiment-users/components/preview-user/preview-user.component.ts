import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { GroupTypes } from '../../../../../core/experiments/store/experiments.model';
import { PreviewUsersService } from '../../../../../core/preview-users/preview-users.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'users-preview-user',
  templateUrl: './preview-user.component.html',
  styleUrls: ['./preview-user.component.scss']
})
export class PreviewUserComponent implements OnInit, OnDestroy {
  displayedColumns = ['id', 'groupType', 'groupId', 'workingGroupType', 'workingGroupId', 'removeEntity'];
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
  // Used to maintain selected groups
  groupList = [];

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor(
    private _formBuilder: FormBuilder,
    private previewUserService: PreviewUsersService
  ) {}

  ngOnInit() {
    this.groupList[0] = this.groupTypes; // To set all group types to first control
    this.previewUsersForm = this._formBuilder.group({
      id: [null, Validators.required],
      // userGroups: this._formBuilder.array([this.getNewUserGroup()])
      group: [null, Validators.required],
      workingGroup: [null]
    });

    // TODO: Remove the code after verification
    // this.previewUsersForm.get('userGroups').valueChanges.pipe(startWith(null)).subscribe((value) => {
    //   if (value) {
    //     for (let i = 0; i < value.length; i++) {
    //        this.groupList[i] = this.getGroupsForFormArray(i, this.groupTypes);
    //     }
    //   }
    // })

    this.allPreviewUsersSub = this.previewUserService.allPreviewUsers$.subscribe(previewUsers => {
      this.allPreviewUsers = new MatTableDataSource();
      this.allPreviewUsers.data = previewUsers;
      this.allPreviewUsers.paginator = this.paginator;
      this.allPreviewUsers.sort = this.sort;
    });
  }

  // TODO: Remove after verifying it
  // getGroupsForFormArray(i, groupList) {
  //   let groupValue;
  //   if (this.previewUsersForm.get('userGroups').value[i - 1]) {
  //     groupValue = this.previewUsersForm.get('userGroups').value[i - 1].groupType;
  //   }
  //   return i === 0 ? groupList : this.groupList[i - 1].filter(group => group.value !== groupValue || group.value === GroupTypes.OTHER);
  // }

  // TODO: Remove after verifying it
  // getNewUserGroup() {
  //   return this._formBuilder.group({
  //     groupType: [null, Validators.required],
  //     customGroupName: [null],
  //     groupId: [null, Validators.required]
  //   }, { validators: ExperimentUserValidators.validatePreviewUserGroupForm });
  // }

  // TODO: Remove after verifying it
  // get userGroups(): FormArray {
  //   return this.previewUsersForm.get('userGroups') as FormArray;
  // }

  // addNewUserGroup() {
  //   this.userGroups.push(this.getNewUserGroup());
  // }

  // removeUserGroup(index: number) {
  //   this.userGroups.removeAt(index);
  // }

  addPreviewUser() {
    const { id, group, workingGroup } = this.previewUsersForm.value;
    // const group = userGroups.reduce((acc, value) => {
    //   return value.groupType === GroupTypes.OTHER ? { ...acc, [value.customGroupName]: value.groupId } : { ...acc, [value.groupType]: value.groupId };
    // }, {});
    // this.previewUsersForm.get('id').reset();
    // this.userGroups.clear();
    // this.userGroups.push(this.getNewUserGroup());
    this.previewUsersForm.reset();
    this.previewUserService.addPreviewUser(id, JSON.parse(group), JSON.parse(workingGroup));

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
