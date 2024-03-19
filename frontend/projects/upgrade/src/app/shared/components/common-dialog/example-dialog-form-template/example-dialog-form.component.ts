import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

/**
 * This is an example of a form component that can be dynamically inserted into a common-dialog-form-dialog.
 * Normally this file should be located in the feauture folder if it's feature-specific, this is just an example.
 */

export interface FormData {
  name: string;
}

@Component({
  selector: 'app-example-dialog-form-template',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, MatFormField, MatInputModule],
  templateUrl: './example-dialog-form-template.component.html',
  styleUrl: './example-dialog-form-template.component.scss',
})
export class ExampleDialogFormTemplateComponent {
  form = this.fb.group({
    name: [''],
  });

  constructor(private fb: FormBuilder) {}
}
