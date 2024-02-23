import { MatCardModule } from '@angular/material/card';
import { AfterViewInit, Component, ComponentRef, Inject, ViewChild, ViewContainerRef } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { NgIf, NgTemplateOutlet } from '@angular/common';
import { TestgDialogFormComponent } from '../general-form-dialog-templates/testg-dialog-form/testg-dialog-form.component';

export interface GeneralFormModalParams {
  formComponent: any;
  title: string;
  cancelBtnLabel?: string;
  primaryActionBtnLabel?: string;
}

@Component({
  selector: 'app-general-form-dialog',
  standalone: true,
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    NgIf,
    NgTemplateOutlet,
    TestgDialogFormComponent,
  ],
  templateUrl: './general-form-dialog.component.html',
  styleUrl: './general-form-dialog.component.scss',
})
export class GeneralFormDialogComponent implements AfterViewInit {
  title: string;
  cancelBtnLabel: string;
  primaryActionBtnLabel: string;
  formComponent: any;
  formComponentRef!: ComponentRef<any>;

  @ViewChild('formContainer', { read: ViewContainerRef }) formComponentContainer!: ViewContainerRef;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public params: GeneralFormModalParams,
    public dialog: MatDialog,
    private dialogRef: MatDialogRef<GeneralFormDialogComponent>
  ) {
    this.formComponent = params.formComponent;
    this.title = params.title;
    this.cancelBtnLabel = params.cancelBtnLabel || 'Cancel';
    this.primaryActionBtnLabel = params.primaryActionBtnLabel = 'Save';
  }

  ngAfterViewInit() {
    this.loadComponent();
  }

  loadComponent() {
    this.formComponentContainer.clear();
    this.formComponentRef = this.formComponentContainer.createComponent(this.formComponent);
  }

  onPrimaryActionBtnClicked() {
    const formData = this.formComponentRef.instance?.form?.value; // form value must exist on the template?
    this.dialogRef.close(formData);
  }
}
