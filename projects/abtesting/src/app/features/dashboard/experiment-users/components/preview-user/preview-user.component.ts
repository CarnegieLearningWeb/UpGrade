import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { PreviewUsersService } from '../../../../../core/preview-users/preview-users.service';
import { Subscription } from 'rxjs';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { UserPermission } from '../../../../../core/auth/store/auth.models';
import { AuthService } from '../../../../../core/auth/auth.service';
import { UserRole } from 'upgrade_types';

@Component({
  selector: 'users-preview-user',
  templateUrl: './preview-user.component.html',
  styleUrls: ['./preview-user.component.scss']
})
export class PreviewUserComponent implements OnInit, OnDestroy {
  permissions: UserPermission;
  permissionSub: Subscription;
  currentUser$ = this.authService.currentUser$;
  displayedColumns = ['id', 'totalAssignedConditions', 'assignment', 'actions'];

  // Used for displaying preview users
  allPreviewUsers: any;
  allPreviewUsersSub: Subscription;
  previewUsersForm: FormGroup;
  previewUserAssignConditionForm: FormGroup;
  isPreviewUserLoading$ = this.previewUserService.isPreviewUserLoading$;

  experimentConditions: any[] = [];
  allExperimentNames = [];
  allExperimentNamesSub: Subscription;
  selectExperimentByIdSub = new Subscription();
  // Used for displaying experiment names after eliminating it if it is previously selected
  allExperimentNamesView = [];
  isLoadingExperiment$ = this.experimentService.isLoadingExperiment$;

  private paginator: MatPaginator;
  private sort: MatSort;

  editMode = null;
  isFormPopulatedFromEditMode = false;

  @ViewChild(MatPaginator, { static: false }) set matPaginator(mp: MatPaginator) {
    this.paginator = mp;
    this.allPreviewUsers.paginator = this.paginator;
  }
  @ViewChild(MatSort, { static: false }) set matSort(ms: MatSort) {
    this.sort = ms;
    this.allPreviewUsers.sort = this.sort;
  }
  @ViewChild('assignCondition', { static: false, read: ElementRef }) assignCondition: ElementRef;

  constructor(
    private _formBuilder: FormBuilder,
    private previewUserService: PreviewUsersService,
    private experimentService: ExperimentService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.permissionSub = this.authService.userPermissions$.subscribe(permission => {
      this.permissions = permission;
    });
    // For creating preview user
    this.previewUsersForm = this._formBuilder.group({
      id: [null, Validators.required],
    });

    // For assigning conditions to preview users
    this.previewUserAssignConditionForm = this._formBuilder.group({
      assignedConditions: this._formBuilder.array([this.getNewExperimentCondition()])
    });

    this.allExperimentNamesSub = this.experimentService.allExperimentNames$.subscribe(experimentInfo => {
      if (experimentInfo) {
        this.allExperimentNames = experimentInfo as any;
        this.allExperimentNamesView[0] = this.allExperimentNames;
      }
    });

    this.allPreviewUsersSub = this.previewUserService.allPreviewUsers$.subscribe(previewUsers => {
      this.allPreviewUsers = new MatTableDataSource();
      this.allPreviewUsers.data = previewUsers;
      this.allPreviewUsers.paginator = this.paginator;
      this.allPreviewUsers.sort = this.sort;
    });

    this.previewUserAssignConditionForm.get('assignedConditions').valueChanges.subscribe((conditions) => {
      if (!this.isFormPopulatedFromEditMode) {
        // Set selection values for assigned conditions
        this.setFormControls(conditions);
      }
    });
  }

  addPreviewUser() {
    const { id } = this.previewUsersForm.value;
    this.previewUsersForm.reset();
    this.previewUserService.addPreviewUser(id.trim());
  }

  removePreviewUser(previewUser: any) {
    this.previewUserService.deletePreviewUser(previewUser.id);
    // Reset assigned condition form if user is deleted after clicking on edit
    this.assignedConditions.clear();
    this.experimentConditions = [];
    this.editMode = null;
  }

  getExperimentNames(index: number) {
    const experimentIds = this.previewUserAssignConditionForm.get('assignedConditions').value
      .filter((assignedCondition, conditionIndex) => !!assignedCondition.experimentId && conditionIndex !== index)
      .map(assignedCondition => assignedCondition.experimentId);
    return this.allExperimentNames.filter(experiment => experimentIds.indexOf(experiment.id) === -1);
  }

  getNewExperimentCondition(experimentId?: string, conditionId?: string) {
    return this._formBuilder.group({
      experimentId: [experimentId, Validators.required],
      conditionId: [conditionId, Validators.required]
    });
  }

  addNewExperimentCondition() {
    this.assignedConditions.push(this.getNewExperimentCondition());
    this.updateView();
  }

  removeExperimentCondition(index: number) {
    this.experimentConditions = this.experimentConditions.splice(index, 1);
    this.assignedConditions.removeAt(index);
    this.setFormControls(this.previewUserAssignConditionForm.get('assignedConditions').value);
  }

  editAssignedConditions(index: number) {
    this.assignedConditions.clear();
    this.experimentConditions = [];
    this.editMode = index;
    this.isFormPopulatedFromEditMode = true;
    const assignments = this.allPreviewUsers.data[index].assignments;
    if (assignments) {
      assignments.map(assignment => {
        this.assignedConditions.push(this.getNewExperimentCondition(assignment.experiment.id, assignment.experimentCondition.id));
      });
      this.setFormControls(this.previewUserAssignConditionForm.get('assignedConditions').value);
    } else {
      this.addNewExperimentCondition();
    }
    this.isFormPopulatedFromEditMode = false;
  }

  setFormControls(assignedConditions: any) {
    for (let i = 0; i < assignedConditions.length; i++) {
      this.allExperimentNamesView[i] = this.getExperimentNames(i);
      if (assignedConditions[i].experimentId) {
        this.experimentConditions[i] = [];
        this.selectExperimentByIdSub.add(this.experimentService.selectExperimentById(assignedConditions[i].experimentId).subscribe(experiment => {
          if (experiment) {
            this.experimentConditions[i] = experiment.conditions;
          }
        }));
      }
    }
  }

  saveAssignedConditions(userId: string) {
    this.editMode = null;
    let { assignedConditions } = this.previewUserAssignConditionForm.value;
    assignedConditions = assignedConditions.map(experimentData => ({
        experiment: {
          id: experimentData.experimentId,
        },
        experimentCondition: {
          id: experimentData.conditionId
        }
    }));
    const data = {
      id: userId,
      assignments: assignedConditions
    }
    this.assignedConditions.clear();
    this.previewUserService.assignConditionForPreviewUser(data);
  }

  // Scroll to the latest condition selection
  updateView() {
    if (this.assignCondition) {
      this.assignCondition.nativeElement.scroll({
        top: this.assignCondition.nativeElement.scrollHeight,
        behavior: 'smooth'
      });
    }
  }

  get assignedConditions(): FormArray {
    return this.previewUserAssignConditionForm.get('assignedConditions') as FormArray;
  }

  get userRole() {
    return UserRole;
  }

  ngOnDestroy() {
    this.allPreviewUsersSub.unsubscribe();
    this.allExperimentNamesSub.unsubscribe();
    this.selectExperimentByIdSub.unsubscribe();
    this.permissionSub.unsubscribe();
  }
}
