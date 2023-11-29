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

    this.registerFormListeners();
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

    allowedGroups.forEach((group, index) => {
      const groupControl = this.fb.control('');
      const workingGroupControl = this.fb.control('');

      this.listenForGroupChanges(groupControl, index);
      this.listenForWorkingGroupChanges(workingGroupControl, index);
  
      groupControls.push(groupControl);
      workingGroupControls.push(workingGroupControl);
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

  resetForm(): void {
    this.userId.patchValue('');
    this.userAliases.patchValue('');
    this.groups.patchValue([]);
    this.workingGroup.patchValue([]);
  }

  resetUserDetailsForModelChange(): void {
    this.eventBusService.resetMockUser();
    this.resetForm();
    this.createGroupsArrays(this.allowedGroups);
  }

  dispatchUserUpdate(user: MockClientAppUser) {
    this.eventBusService.dispatchMockUserChange(user);
  }

  splitAndTrim(values: string): string[] {
    return values.split(',').map((value) => value.trim());
  }

  registerFormListeners(): void {
    this.listenForUserIdChanges();
    this.listenForUserAliasesChanges();
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

  listenForGroupChanges(groupControl: FormControl, index: number): void {
    groupControl.valueChanges.pipe(debounceTime(400)).subscribe((groupInputString) => {
      console.log('groupInputString', groupInputString);
      if (groupInputString === null) return;
  
      const user = { ...this.eventBusService.mockAppUser$.value };
      user.groups[this.allowedGroups[index]] = this.splitAndTrim(groupInputString);

      this.dispatchUserUpdate(user);
    });
  }

  listenForWorkingGroupChanges(workingGroupControl: FormControl, index: number): void {
    workingGroupControl.valueChanges.pipe(debounceTime(400)).subscribe((workingGroupInputString) => {
      console.log('workingGroupInputString', workingGroupInputString);
      if (workingGroupInputString === null) return;
  
      const user = { ...this.eventBusService.mockAppUser$.value };
      user.workingGroup[this.allowedGroups[index]] = workingGroupInputString;

      this.dispatchUserUpdate(user);
    });
  }

  listenForMockAppChanges(): void {
    this.eventBusService.mockApp$.subscribe((mockAppName) => {
      const model = this.mockClientAppService.getMockAppInterfaceModelByName(mockAppName);
      this.allowedGroups = model.groups;

      // may need to check that the model has changed
      this.resetUserDetailsForModelChange();
    });
  }
}
