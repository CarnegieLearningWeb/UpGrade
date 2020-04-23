import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { UserRole } from 'upgrade_types';
import { UsersService } from '../../../../../../core/users/users.service';

@Component({
  selector: 'app-new-user',
  templateUrl: './new-user.component.html',
  styleUrls: ['./new-user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewUserComponent implements OnInit {
  newUserForm: FormGroup;
  userRole = [UserRole.ADMIN, UserRole.CREATOR, UserRole.USER_MANAGER, UserRole.READER];
  isUserExist = false;
  constructor(
    public dialogRef: MatDialogRef<NewUserComponent>,
    private _formBuilder: FormBuilder,
    private usersService: UsersService,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {}

  ngOnInit() {
    this.newUserForm = this._formBuilder.group({
      email: [null, [Validators.required, Validators.email]],
      role: [null, Validators.required]
    });
  }

  onNoClick() {
    this.dialogRef.close();
  }

  addNewUser() {
    const { email, role } = this.newUserForm.value;
    this.isUserExist = !!this.data.users.find(user => user.email === email);
    if (!this.isUserExist) {
      this.usersService.createNewUser(email, role);
      this.onNoClick();
    }
  }
}
