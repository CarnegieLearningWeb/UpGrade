import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { MockClientAppUser } from '../../../../../shared/models';
import { EventBusService } from 'src/app/services/event-bus.service';
import { MockClientAppService } from 'src/app/services/mock-client-app.service';

@Component({
  selector: 'app-user-form',
  templateUrl: './app-user-form.component.html',
  styleUrls: ['./app-user-form.component.scss'],
})
export class AppUserFormComponent implements OnInit {
  @Input() allowedGroups!: string[];
  userForm!: FormGroup;
  openUserDetails = false;

  constructor(
    private fb: FormBuilder,
    private eventBusService: EventBusService,
    private mockClientAppService: MockClientAppService
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    this.createGroupsArrays(this.allowedGroups);
    console.log('allowedGroups: ', this.allowedGroups);
    console.log(this.userForm.value);

    this.listenForUserIdChanges();
    this.listenForUserAliasesChanges();
    this.listenForGroupsChanges();
    this.listenForWorkingGroupChanges();
    this.listenForMockAppChanges();
  }

  createForm() {
    this.userForm = this.fb.group({
      userId: this.fb.control('', Validators.required),
      groups: this.fb.array([]),
      workingGroup: this.fb.array([]),
      userAliases: this.fb.control(''),
    });
  }

  get userId(): FormControl {
    return this.userForm?.get('userId') as FormControl;
  }

  get userAliases(): FormControl {
    return this.userForm?.get('userAliases') as FormControl;
  }

  get groups(): FormArray {
    return this.userForm?.get('groups') as FormArray;
  }

  get workingGroup(): FormArray {
    return this.userForm?.get('workingGroup') as FormArray;
  }

  createGroupsArrays(allowedGroups: string[]) {
    const groupControls: FormControl[] = [];
    const workingGroupControls: FormControl[] = [];

    allowedGroups.forEach(() => {
      groupControls.push(this.fb.control(''));
      workingGroupControls.push(this.fb.control(''));
    });

    const groupControlsArray = this.fb.array(groupControls);
    const workingGroupControlsArray = this.fb.array(workingGroupControls);

    this.userForm.setControl('groups', groupControlsArray);
    this.userForm.setControl('workingGroup', workingGroupControlsArray);
  }

  initializeUserGroups(): void {
    const user = { ...this.eventBusService.mockAppUser$.value };

    this.allowedGroups.forEach((group: string) => {
      user.groups[group] = [''];
    });

    this.dispatchUserUpdate(user);
  }

  dispatchUserUpdate(user: MockClientAppUser) {
    this.eventBusService.dispatchMockUserChange(user);
  }

  splitAndTrim(values: string): string[] {
    return values.split(',').map((value) => value.trim());
  }

  listenForUserIdChanges(): void {
    this.userId.valueChanges.pipe(debounceTime(400)).subscribe((userId) => {
      console.log('userId', userId);
      const user = { ...this.eventBusService.mockAppUser$.value };
      user.id = userId;
      this.dispatchUserUpdate(user);
    });
  }

  listenForUserAliasesChanges(): void {
    this.userAliases.valueChanges.pipe(debounceTime(400)).subscribe((userAliases) => {
      console.log('userAliases', userAliases);
      const user = { ...this.eventBusService.mockAppUser$.value };
      user.userAliases = this.splitAndTrim(userAliases);
      this.dispatchUserUpdate(user);
    });
  }

  listenForGroupsChanges(): void {
    this.groups.valueChanges.pipe(debounceTime(400)).subscribe((groups) => {
      console.log('groups', groups);
      const user = { ...this.eventBusService.mockAppUser$.value };

      groups.forEach((group: string, index: number) => {
        user.groups[this.allowedGroups[index]] = this.splitAndTrim(group);
      });

      this.dispatchUserUpdate(user);
    });
  }

  listenForWorkingGroupChanges(): void {
    this.workingGroup.valueChanges.pipe(debounceTime(400)).subscribe((workingGroup) => {
      console.log('workingGroup', workingGroup);
      const user = { ...this.eventBusService.mockAppUser$.value };
      workingGroup.forEach((workingGroup: string, index: number) => {
        user.workingGroup[this.allowedGroups[index]] = workingGroup;
      });
      this.dispatchUserUpdate(user);
    });
  }

  listenForMockAppChanges(): void {
    this.eventBusService.mockApp$.subscribe((mockAppName) => {
      const model = this.mockClientAppService.getMockAppInterfaceModelByName(mockAppName);
      this.allowedGroups = model.groups;
      // clear the form, but shouldn't it do this already?
      console.log('i fired');
      console.log('model: ', model);
      this.createForm();
      this.createGroupsArrays(this.allowedGroups);
    });
  }
}
