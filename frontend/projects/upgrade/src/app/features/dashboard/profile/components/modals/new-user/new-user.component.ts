import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { UserRole } from 'upgrade_types';
import { UsersService } from '../../../../../../core/users/users.service';

@Component({
  selector: 'app-new-user',
  templateUrl: './new-user.component.html',
  styleUrls: ['./new-user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewUserComponent implements OnInit {
  newUserForm: UntypedFormGroup;
  userRole = [UserRole.ADMIN, UserRole.CREATOR, UserRole.USER_MANAGER, UserRole.READER];
  isUserExist = false;
  constructor(
    public dialogRef: MatDialogRef<NewUserComponent>,
    private _formBuilder: UntypedFormBuilder,
    private usersService: UsersService,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {}

  ngOnInit() {
    this.newUserForm = this._formBuilder.group({
      firstName: [null, Validators.required],
      lastName: [null, Validators.required],
      email: [null, [Validators.required, Validators.email]],
      role: [null, Validators.required],
    });
  }

  onNoClick() {
    this.dialogRef.close();
  }

  addNewUser() {
    const { firstName, lastName, email, role } = this.newUserForm.value;
    this.isUserExist = !!this.data.users.find((user) => user.email === email);
    if (!this.isUserExist) {
      this.usersService.createNewUser(firstName, lastName, email, role);
      this.onNoClick();
    }
  }
}
