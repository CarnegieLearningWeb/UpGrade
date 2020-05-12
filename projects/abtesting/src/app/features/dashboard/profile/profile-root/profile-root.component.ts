import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { UsersService } from '../../../../core/users/users.service';
import { MatTableDataSource, MatPaginator, MatSort, MatDialog } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User, UserRole } from '../../../../core/users/store/users.model';
import { UserPermission } from '../../../../core/auth/store/auth.models';
import { Subscription, Observable } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { NewUserComponent } from '../components/modals/new-user/new-user.component';

@Component({
  selector: 'app-profile-root',
  templateUrl: './profile-root.component.html',
  styleUrls: ['./profile-root.component.scss']
})
export class ProfileRootComponent implements OnInit, OnDestroy {
  permissions$: Observable<UserPermission>;
  displayedUsersColumns: string[] = ['firstName', 'lastName', 'email', 'role', 'edit'];
  userRoleForm: FormGroup;
  editMode = null;
  userRoles = [UserRole.ADMIN, UserRole.CREATOR, UserRole.USER_MANAGER, UserRole.READER];
  allUsers: any;
  allUsersSub: Subscription;
  isUsersLoading: boolean;
  isUsersLoadingSub: Subscription;
  currentUser: User;
  currentUserSub: Subscription;
  searchString: string;

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
    private authService: AuthService,
    private _matDialog: MatDialog
  ) {}

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
    this.userRoleForm = this._formBuilder.group({
      role: [null, Validators.required]
    });
    this.currentUserSub = this.authService.currentUser$.subscribe(currentUser => {
      this.currentUser = currentUser;
    });
    this.allUsersSub = this.usersService.allUsers$.subscribe(users => {
      this.allUsers = new MatTableDataSource(users);
      this.allUsers.paginator = this.paginator;
      this.allUsers.sort = this.sort;
    });
    this.isUsersLoadingSub = this.usersService.isUsersLoading$.subscribe(isUserLoaded => {
      this.isUsersLoading = isUserLoaded;
      if (!isUserLoaded) {
        this.applyFilter(this.searchString);
      }
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
    if (user.email === this.currentUser.email) {
      window.location.reload();
    }
  }

  // Reset form to keep consistency of selected user in form
  resetForm() {
    this.editMode = null;
    this.userRoleForm.reset();
  }

  applyFilter(filterValue: string) {
    if (filterValue !== undefined) {
      this.allUsers.filter = filterValue.trim().toLowerCase();
      this.resetForm();
    }
  }

  openNewUserModal() {
    const dialogRef = this._matDialog.open(NewUserComponent, {
      panelClass: 'new-user-modal',
      disableClose: false,
      data: { users: this.allUsers.data }
    });

    dialogRef.afterClosed().subscribe(result => {
      // Do action after closing dialog
    });
  }

  ngOnDestroy() {
    this.allUsersSub.unsubscribe();
    this.currentUserSub.unsubscribe();
    this.isUsersLoadingSub.unsubscribe();
  }

  get UserRole() {
    return UserRole;
  }
}
