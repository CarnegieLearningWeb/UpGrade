import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { PreviewUsersService } from '../../../../../core/preview-users/preview-users.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'users-preview-user',
  templateUrl: './preview-user.component.html',
  styleUrls: ['./preview-user.component.scss']
})
export class PreviewUserComponent implements OnInit, OnDestroy {
  displayedColumns = ['id', 'removeEntity'];
  allPreviewUsers: any;
  allPreviewUsersSub: Subscription;
  isPreviewUserLoading$ = this.previewUserService.isPreviewUserLoading$;

  previewUsersForm: FormGroup;

  private paginator: MatPaginator;
  private sort: MatSort;

  @ViewChild(MatPaginator, {static: false}) set matPaginator(mp: MatPaginator) {
    this.paginator = mp;
    this.allPreviewUsers.paginator = this.paginator;
  }
  @ViewChild(MatSort, {static: false}) set matSort(ms: MatSort) {
    this.sort = ms;
    this.allPreviewUsers.sort = this.sort;
  }

  constructor(
    private _formBuilder: FormBuilder,
    private previewUserService: PreviewUsersService
  ) {}

  ngOnInit() {
    this.previewUsersForm = this._formBuilder.group({
      id: [null, Validators.required],
    });

    this.allPreviewUsersSub = this.previewUserService.allPreviewUsers$.subscribe(previewUsers => {
      this.allPreviewUsers = new MatTableDataSource();
      this.allPreviewUsers.data = previewUsers;
      this.allPreviewUsers.paginator = this.paginator;
      this.allPreviewUsers.sort = this.sort;
    });
  }

  addPreviewUser() {
    const { id } = this.previewUsersForm.value;
    this.previewUsersForm.reset();
    this.previewUserService.addPreviewUser(id.trim());

  }

  removePreviewUser(previewUser: any) {
    this.previewUserService.deletePreviewUser(previewUser.id);
  }

  ngOnDestroy() {
    this.allPreviewUsersSub.unsubscribe();
  }
}
