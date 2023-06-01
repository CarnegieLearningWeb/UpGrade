import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { EventBusService } from 'src/app/services/event-bus.service';

@Component({
  selector: 'app-user-form',
  templateUrl: './app-user-form.component.html',
  styleUrls: ['./app-user-form.component.scss'],
})
export class AppUserFormComponent implements OnInit {
  userForm: FormGroup;
  @Input() allowedGroups!: string[];

  constructor(private fb: FormBuilder, private eventBusService: EventBusService) {
    this.userForm = this.fb.group({
      userId: this.fb.control('', Validators.required),
      groups: this.fb.array([]),
      workingGroup: this.fb.array([]),
      userAliases: this.fb.control(''),
    });
    // this.createGroupsArray(this.allowedGroups);
    console.log('allowedGroups: ', this.allowedGroups);
    console.log(this.userForm.value);
  }

  ngOnInit(): void {
    this.listenForUserIdChanges();
    this.listenForUserAliasesChanges();
  }

  createGroupsArray(allowedGroups: string[]): FormArray {
    const groupControls: FormControl[] = [];
    allowedGroups.forEach((group) => {
      groupControls.push(this.fb.control(group));
    });
    return this.fb.array(groupControls);
  }

  listenForUserIdChanges(): void {
    this.userForm
      .get('userId')
      ?.valueChanges.pipe(debounceTime(400))
      .subscribe((userId) => {
        console.log('userId', userId);
        const user = { ...this.eventBusService.mockAppUser$.value };
        user.id = userId;
        this.eventBusService.dispatchMockUserChange(user);
      });
  }

  listenForUserAliasesChanges(): void {
    this.userForm
      .get('userAliases')
      ?.valueChanges.pipe(debounceTime(400))
      .subscribe((userAliases) => {
        console.log('userAliases', userAliases);
        const user = { ...this.eventBusService.mockAppUser$.value };
        user.userAliases = userAliases.split(',');
        this.eventBusService.dispatchMockUserChange(user);
      });
  }
}
