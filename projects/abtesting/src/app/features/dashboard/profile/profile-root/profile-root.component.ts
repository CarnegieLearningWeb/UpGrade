import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { UsersService } from '../../../../core/users/users.service';
import { MatTableDataSource, MatPaginator, MatSort } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User, UserRole } from '../../../../core/users/store/users.model';
import { UserPermission } from '../../../../core/auth/store/auth.models';
import { Subscription, Observable } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-profile-root',
  templateUrl: './profile-root.component.html',
  styleUrls: ['./profile-root.component.scss']
})
export class ProfileRootComponent implements OnInit, OnDestroy {
  permissions$: Observable<UserPermission>;
  displayedUsersColumns: string[] = [
    'firstName',
    'lastName',
    'email',
    'role',
    'edit'
  ];
  allUsers: any;
  allUsersSub: Subscription;
  isUsersLoading$ = this.usersService.isUsersLoading$;
  userRoleForm: FormGroup;
  editMode = null;
  userRoles = [
    UserRole.ADMIN,
    UserRole.CREATOR,
    UserRole.USER_MANAGER,
    UserRole.READER,
  ];
  currentUser$ = this.authService.currentUser$;

  private paginator: MatPaginator;
  private sort: MatSort;
  @ViewChild(MatPaginator, { static: false }) set matPaginator(mp: MatPaginator) {
    this.paginator = mp;
    this.allUsers.paginator = this.paginator;
  }
  @ViewChild(MatSort, { static: false }) set matSort(ms: MatSort) {
    this.sort = ms;
    this.allUsers.sort = this.sort;
  }

  constructor(
    private usersService: UsersService,
    private _formBuilder: FormBuilder,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;

    this.userRoleForm = this._formBuilder.group({
      role: [null, Validators.required]
    });
    this.allUsersSub = this.usersService.allUsers$.subscribe(users => {
      this.allUsers = new MatTableDataSource(users);
      this.allUsers.paginator = this.paginator;
      this.allUsers.sort = this.sort;
    });
  }

  editPermission(user: User, index: number) {
    this.editMode = index;
    this.userRoleForm.setValue({
      role: user.role
    });
  }

  updatePermission(user: User) {
    const { role } = this.userRoleForm.value;
    this.editMode = null;
    this.userRoleForm.reset();
    this.usersService.updateUserRole(user.email, role);
  }

  // Reset form to keep consistency of selected user in form
  userSortingChange() {
    this.editMode = null;
    this.userRoleForm.reset();
  }

  ngOnDestroy() {
    this.allUsersSub.unsubscribe();
  }

  get UserRole() {
    return UserRole;
  }

}
