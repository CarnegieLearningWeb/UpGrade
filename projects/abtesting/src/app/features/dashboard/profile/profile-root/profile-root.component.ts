import { Component, OnInit, ViewChild, OnDestroy, ElementRef } from '@angular/core';
import { UsersService } from '../../../../core/users/users.service';
import { MatTableDataSource, MatSort, MatDialog } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User, UserRole, USER_SEARCH_SORT_KEY } from '../../../../core/users/store/users.model';
import { UserPermission } from '../../../../core/auth/store/auth.models';
import { Subscription, Observable, fromEvent } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { NewUserComponent } from '../components/modals/new-user/new-user.component';
import { SettingsService } from '../../../../core/settings/settings.service';
import { debounceTime } from 'rxjs/operators';

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
  isAllUsersFetchedSub: Subscription;
  searchString: string;
  toCheckAuth$ = this.settingsService.toCheckAuth$;
  userFilterOptions = [
    { value: USER_SEARCH_SORT_KEY.ALL, viewValue: 'All'},
    { value: USER_SEARCH_SORT_KEY.FIRST_NAME, viewValue: 'First Name'},
    { value: USER_SEARCH_SORT_KEY.LAST_NAME, viewValue: 'Last Name'},
    { value: USER_SEARCH_SORT_KEY.EMAIL, viewValue: 'Email'},
    { value: USER_SEARCH_SORT_KEY.ROLE, viewValue: 'Role'},
  ];
  selectedUserFilterOption = USER_SEARCH_SORT_KEY.ALL;

  @ViewChild('usersTable', { static: false }) set content(content: ElementRef) {
    if (content) {
       this.fetchUsersOnScroll(content);
    }
 }
 // Used to prevent execution of searchInput setter multiple times
 isSearchInputRefSet = false;
 @ViewChild('searchInput', { static: false }) set searchInput(searchInput: ElementRef) {
   if (searchInput && !this.isSearchInputRefSet) {
    this.isSearchInputRefSet = true;
    fromEvent(searchInput.nativeElement, 'keyup').pipe(debounceTime(500)).subscribe(input => {
      this.setSearchString((input as any).target.value);
    });
   }
 }

  private sort: MatSort;
  @ViewChild(MatSort, { static: false }) set matSort(ms: MatSort) {
    this.sort = ms;
    this.allUsers.sort = this.sort;
  }

  constructor(
    private usersService: UsersService,
    private _formBuilder: FormBuilder,
    private authService: AuthService,
    private _matDialog: MatDialog,
    private settingsService: SettingsService
  ) {}

  ngOnInit() {
    this.usersService.fetchUsers(true);
    this.permissions$ = this.authService.userPermissions$;
    this.userRoleForm = this._formBuilder.group({
      role: [null, Validators.required]
    });
    this.currentUserSub = this.authService.currentUser$.subscribe(currentUser => {
      this.currentUser = currentUser;
    });
    this.allUsersSub = this.usersService.allUsers$.subscribe(users => {
      this.allUsers = new MatTableDataSource(users);
      this.allUsers.sort = this.sort;
    });
    this.isUsersLoadingSub = this.usersService.isUsersLoading$.subscribe(isUserLoaded => {
      this.isUsersLoading = isUserLoaded;
      if (!isUserLoaded) {
        this.applyFilter(this.searchString);
      }
    });
  }

  // Modify angular material's table's default search behavior
  filterExperimentPredicate(type: USER_SEARCH_SORT_KEY) {
    this.allUsers.filterPredicate = (data, filter: string): boolean => {
      switch (type) {
        case USER_SEARCH_SORT_KEY.ALL:
          return (data.firstName && data.firstName.toLowerCase().includes(filter))
            || (data.lastName && data.lastName.toLowerCase().includes(filter))
            || data.email.toLowerCase().includes(filter)
            || data.role.toLowerCase().includes(filter);
        case USER_SEARCH_SORT_KEY.FIRST_NAME:
          return data.firstName && data.firstName.toLowerCase().includes(filter);
        case USER_SEARCH_SORT_KEY.LAST_NAME:
          return data.lastName && data.lastName.toLowerCase().includes(filter);
        case USER_SEARCH_SORT_KEY.EMAIL:
          return data.email.toLowerCase().includes(filter);
        case USER_SEARCH_SORT_KEY.ROLE:
          return data.role.toLowerCase().includes(filter);
      }
    };
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
    this.filterExperimentPredicate(this.selectedUserFilterOption);
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

  changeAuthenticationFlag(event: any) {
    this.settingsService.setToCheckAuth(event.checked);
  }

  setSearchKey() {
    this.usersService.setSearchKey(this.selectedUserFilterOption);
  }

  setSearchString(searchString: string) {
    this.usersService.setSearchString(searchString);
  }

  fetchUsersOnScroll(usersTableContainer) {
    if (!this.isAllUsersFetchedSub) {
      const windowHeight = window.innerHeight;
      usersTableContainer.nativeElement.style.maxHeight = (windowHeight - 523) + 'px';
      let isAllUsersFetched = false;
      this.isAllUsersFetchedSub = this.usersService.isAllUsersFetched().subscribe(
        value => isAllUsersFetched = value
      );
      // TODO: Make a common logic for this
      fromEvent(usersTableContainer.nativeElement, 'scroll').pipe(debounceTime(500)).subscribe(value => {
        if (!isAllUsersFetched) {
          const height = usersTableContainer.nativeElement.clientHeight;
          const scrollHeight = usersTableContainer.nativeElement.scrollHeight - height;
          const scrollTop = usersTableContainer.nativeElement.scrollTop;
          const percent = Math.floor(scrollTop / scrollHeight * 100);
          if (percent > 80) {
            this.usersService.fetchUsers();
          }
        }
      });
    }
  }

  changeSorting(event) {
    this.usersService.setSortingType(event.direction ? event.direction.toUpperCase() : null);
    this.usersService.setSortKey(event.direction ? event.active : null);
    this.usersService.fetchUsers(true);
  }

  ngOnDestroy() {
    this.allUsersSub.unsubscribe();
    this.currentUserSub.unsubscribe();
    this.isUsersLoadingSub.unsubscribe();
    this.isAllUsersFetchedSub.unsubscribe();

    // Reset all filters of users
    this.usersService.setSearchString(null);
    this.usersService.setSearchKey(USER_SEARCH_SORT_KEY.ALL);
    this.usersService.setSortKey(null);
    this.usersService.setSortingType(null);
  }

  get UserRole() {
    return UserRole;
  }
}
