import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { Observable, Subscription, fromEvent } from 'rxjs';
import { UserPermission } from '../../../../../core/auth/store/auth.models';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { UserRole } from 'upgrade_types';
import { User, USER_SEARCH_SORT_KEY } from '../../../../../core/users/store/users.model';
import { debounceTime } from 'rxjs/operators';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { MatSort } from '@angular/material/sort';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
import { UsersService } from '../../../../../core/users/users.service';
import { AuthService } from '../../../../../core/auth/auth.service';
import { SettingsService } from '../../../../../core/settings/settings.service';
import { NewUserComponent } from '../modals/new-user/new-user.component';
import { DeleteComponent } from '../../../../../shared/components/delete/delete.component';
import { ThemeOptions } from '../../../../../core/settings/store/settings.model';
import { FLAG_SEARCH_SORT_KEY } from '../../../../../core/feature-flags/store/feature-flags.model';

@Component({
  selector: 'profile-info',
  templateUrl: './profile-info.component.html',
  styleUrls: ['./profile-info.component.scss'],
})
export class ProfileInfoComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('profileInfoContainer') profileInfoContainer: ElementRef;

  permissions$: Observable<UserPermission>;
  theme$ = this.settingsService.theme$;
  displayedUsersColumns: string[] = ['firstName', 'lastName', 'email', 'role', 'edit', 'deleteUser'];
  userDetailsForm: UntypedFormGroup;
  editMode = null;
  userRoles = [UserRole.ADMIN, UserRole.CREATOR, UserRole.USER_MANAGER, UserRole.READER];
  allUsers: any;
  allUsersSub: Subscription;
  isUsersLoading: boolean;
  isUsersLoadingSub: Subscription;
  currentUser: User;
  currentUserSub: Subscription;
  isAllUsersFetched = false;
  isAllUsersFetchedSub: Subscription;
  searchString: string;
  toCheckAuth$ = this.settingsService.toCheckAuth$;
  toFilterMetric$ = this.settingsService.toFilterMetric$;
  userFilterOptions = [
    { value: USER_SEARCH_SORT_KEY.ALL, viewValue: 'All' },
    { value: USER_SEARCH_SORT_KEY.FIRST_NAME, viewValue: 'First Name' },
    { value: USER_SEARCH_SORT_KEY.LAST_NAME, viewValue: 'Last Name' },
    { value: USER_SEARCH_SORT_KEY.EMAIL, viewValue: 'Email' },
    { value: USER_SEARCH_SORT_KEY.ROLE, viewValue: 'Role' },
  ];
  selectedUserFilterOption = USER_SEARCH_SORT_KEY.ALL;
  // Used to prevent execution of searchInput setter multiple times
  isSearchInputRefSet = false;
  sort: MatSort;

  constructor(
    private usersService: UsersService,
    private _formBuilder: UntypedFormBuilder,
    private authService: AuthService,
    private _matDialog: MatDialog,
    private settingsService: SettingsService
  ) {}

  get UserRole() {
    return UserRole;
  }

  get ThemeOptions() {
    return ThemeOptions;
  }

  @ViewChild('usersTable') set content(content: ElementRef) {
    if (content) {
      const windowHeight = window.innerHeight;
      content.nativeElement.style.maxHeight = windowHeight - 557 + 'px';
    }
  }

  @ViewChild('searchInput') set searchInput(searchInput: ElementRef) {
    if (searchInput && !this.isSearchInputRefSet) {
      this.isSearchInputRefSet = true;
      fromEvent(searchInput.nativeElement, 'keyup')
        .pipe(debounceTime(500))
        .subscribe((input) => {
          this.setSearchString((input as any).target.value);
        });
    }
  }

  @ViewChild(MatSort) set matSort(ms: MatSort) {
    this.sort = ms;
    this.allUsers.sort = this.sort;
  }

  ngOnInit() {
    this.usersService.fetchUsers(true);
    this.permissions$ = this.authService.userPermissions$;
    this.userDetailsForm = this._formBuilder.group({
      firstName: [null, Validators.required],
      lastName: [null, Validators.required],
      email: [null, Validators.required],
      role: [null, Validators.required],
    });
    this.currentUserSub = this.authService.currentUser$.subscribe((currentUser) => {
      this.currentUser = currentUser;
    });
    this.allUsersSub = this.usersService.allUsers$.subscribe((users) => {
      this.allUsers = new MatTableDataSource(users);
      this.allUsers.sort = this.sort;
    });
    this.isUsersLoadingSub = this.usersService.isUsersLoading$.subscribe((isUserLoaded) => {
      this.isUsersLoading = isUserLoaded;
      if (!isUserLoaded) {
        this.applyFilter(this.searchString);
      }
    });

    this.isAllUsersFetchedSub = this.usersService
      .isAllUsersFetched()
      .subscribe((value) => (this.isAllUsersFetched = value));
  }

  // Modify angular material's table's default search behavior
  filterExperimentPredicate(type: USER_SEARCH_SORT_KEY) {
    this.allUsers.filterPredicate = (data, filter: string): boolean => {
      switch (type) {
        case USER_SEARCH_SORT_KEY.ALL:
          return (
            (data.firstName && data.firstName.toLowerCase().includes(filter)) ||
            (data.lastName && data.lastName.toLowerCase().includes(filter)) ||
            data.email.toLowerCase().includes(filter) ||
            data.role.toLowerCase().includes(filter)
          );
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
    this.userDetailsForm.setValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    });
  }

  updatePermission(user: User) {
    const { firstName, lastName, email, role } = this.userDetailsForm.value;
    this.editMode = null;
    this.userDetailsForm.reset();
    this.usersService.updateUserDetails(firstName, lastName, email, role);
    if (user.email === this.currentUser.email) {
      window.location.reload();
    }
  }

  // Reset form to keep consistency of selected user in form
  resetForm() {
    this.editMode = null;
    this.userDetailsForm.reset();
  }

  applyFilter(filterValue: string) {
    this.filterExperimentPredicate(this.selectedUserFilterOption);
    if (filterValue !== undefined) {
      this.allUsers.filter = filterValue.trim().toLowerCase();
      this.resetForm();
    }
  }

  openNewUserModal() {
    this._matDialog.open(NewUserComponent, {
      panelClass: 'new-user-modal',
      disableClose: false,
      data: { users: this.allUsers.data },
    });
  }

  openDeleteUserModal(user: User) {
    const dialogRef = this._matDialog.open(DeleteComponent, {
      panelClass: 'delete-modal',
    });

    dialogRef.afterClosed().subscribe((isDeleteButtonClicked) => {
      if (isDeleteButtonClicked) {
        this.usersService.deleteUser(user.email);
        // Reset the form if user is deleted after clicking on edit
        this.resetForm();
      }
    });
  }

  setToCheckAuth(event: any) {
    this.settingsService.setToCheckAuth(event.checked);
  }

  setToFilterMetric(event: any) {
    this.settingsService.setToFilterMetric(event.checked);
  }

  setSearchKey() {
    this.usersService.setSearchKey(this.selectedUserFilterOption);
  }

  setSearchString(searchString: FLAG_SEARCH_SORT_KEY) {
    this.usersService.setSearchString(searchString);
  }

  fetchUsersOnScroll() {
    if (!this.isAllUsersFetched) {
      this.usersService.fetchUsers();
    }
  }

  changeSorting(event) {
    this.usersService.setSortingType(event.direction ? event.direction.toUpperCase() : null);
    this.usersService.setSortKey(event.direction ? event.active : null);
    this.usersService.fetchUsers(true);
  }

  changeTheme(event) {
    const theme = event.checked ? ThemeOptions.DARK_THEME : ThemeOptions.LIGHT_THEME;
    this.settingsService.changeTheme(theme);
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

  ngAfterViewInit() {
    // subtract other component's height
    const windowHeight = window.innerHeight;
    this.profileInfoContainer.nativeElement.style.height = windowHeight - 325 + 'px';
  }
}
