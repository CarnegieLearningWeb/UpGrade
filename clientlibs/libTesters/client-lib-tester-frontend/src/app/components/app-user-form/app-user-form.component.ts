import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { EventBusService } from 'src/app/services/event-bus.service';

@Component({
  selector: 'app-user-form',
  templateUrl: './app-user-form.component.html',
  styleUrls: ['./app-user-form.component.scss'],
})
export class AppUserFormComponent implements OnInit {
  userForm: FormGroup;

  constructor(private fb: FormBuilder, private eventBusService: EventBusService) {
    this.userForm = this.fb.group({
      userId: this.fb.control('', Validators.required),
      group: this.fb.control(''),
      workingGroup: this.fb.control(''),
      userAliases: this.fb.control(''),
    });
  }

  ngOnInit(): void {
    this.listenForUserIdChanges();
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
}
