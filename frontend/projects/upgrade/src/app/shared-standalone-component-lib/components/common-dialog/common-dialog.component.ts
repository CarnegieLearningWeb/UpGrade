import { MatCardModule } from '@angular/material/card';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ComponentRef,
  ContentChild,
  Inject,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
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
import { ExampleDialogFormTemplateComponent } from './example-dialog-form-template/example-dialog-form.component';
import { BASE_DIALOG_CONFIG_DEFAULTS, CommonDialogConfig } from './common-dialog-config';

@Component({
  selector: 'app-common-dialog',
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
    ExampleDialogFormTemplateComponent,
  ],
  templateUrl: './common-dialog.component.html',
  styleUrl: './common-dialog.component.scss',
})
export class CommonDialogComponent implements AfterViewInit {
  configData: CommonDialogConfig = BASE_DIALOG_CONFIG_DEFAULTS.data;
  // childContentComponentRef!: ComponentRef<any>;

  // @ViewChild('childContentComponentContainer', { read: ViewContainerRef })
  // childContentComponentContainer!: ViewContainerRef;
  @ContentChild(ExampleDialogFormTemplateComponent) childComponent: any;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: CommonDialogConfig,
    public dialog: MatDialog,
    public changeDetectorRef: ChangeDetectorRef,
    private dialogRef: MatDialogRef<CommonDialogComponent>
  ) {
    this.configData = data;
  }

  ngAfterViewInit() {
    console.log('this.childComponent', this.childComponent);
  }

  onPrimaryActionBtnClicked() {
    const formData = this.childComponent?.form?.value; // form value must exist on the template?

    this.dialogRef.close(formData);
  }
}
