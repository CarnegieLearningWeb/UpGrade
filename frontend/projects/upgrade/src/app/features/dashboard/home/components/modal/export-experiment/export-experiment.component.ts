import { Component, ChangeDetectionStrategy, OnInit, Inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { first } from 'rxjs/operators';
import { EXPORT_METHOD } from 'upgrade_types';
import { AuthService } from '../../../../../../core/auth/auth.service';
import { ExperimentVM } from '../../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'experiment-export',
    templateUrl: './export-experiment.component.html',
    styleUrls: ['./export-experiment.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ExportModalComponent implements OnInit {
  exportMethod = [];
  emailId: string;
  exportForm: UntypedFormGroup;
  private formSubscription: Subscription;
  experiments: ExperimentVM[];
  isExportMethodSelected = false;
  exportAll: boolean;
  isExperimentsExportLoading$ = this.experimentService.isExperimentsExportLoading$;
  constructor(
    private _formBuilder: UntypedFormBuilder,
    private experimentService: ExperimentService,
    private authService: AuthService,
    public dialogRef: MatDialogRef<ExportModalComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    this.experiments = this.data.experiment;
    this.exportAll = this.data.exportAll || false;
  }

  onCancelClick(): void {
    this.isExperimentsExportLoading$.pipe(first((loading) => !loading)).subscribe(() => {
      this.dialogRef.close();
    });
  }

  ngOnInit() {
    this.exportForm = this._formBuilder.group({
      exportMethod: [{ value: '' }, Validators.required],
      emailId: '',
    });
    this.exportMethod = [{ value: EXPORT_METHOD.DESIGN }, { value: EXPORT_METHOD.DATA }];
    this.authService.currentUser$.pipe(first()).subscribe((userInfo) => {
      if (userInfo.email) {
        this.emailId = userInfo.email;
      }
    });

    this.formSubscription = this.exportForm.valueChanges.subscribe((value) => {
      const { exportMethod } = value;
      this.isExportMethodSelected = !!exportMethod;
    });
  }

  exportExperimentInfo(experimentId: string, experimentName: string) {
    this.experimentService.exportExperimentInfo(experimentId, experimentName);
  }
  exportExperimentDesign(experimentIds: string[]) {
    this.experimentService.exportExperimentDesign(experimentIds);
  }

  exportAllExperimentDesign() {
    this.experimentService.exportAllExperimentDesign();
  }

  exportExperiment() {
    const { exportMethod } = this.exportForm.value;
    if (exportMethod === EXPORT_METHOD.DATA && this.experiments[0]) {
      this.exportExperimentInfo(this.experiments[0].id, this.experiments[0].name);
    } else if (exportMethod === EXPORT_METHOD.DESIGN) {
      if (this.exportAll) {
        this.exportAllExperimentDesign();
      } else {
        this.exportExperimentDesign(this.experiments.map((exp) => exp.id));
      }
    }
    this.onCancelClick();
  }

  ngOnDestroy(): void {
    this.formSubscription.unsubscribe();
  }
}
