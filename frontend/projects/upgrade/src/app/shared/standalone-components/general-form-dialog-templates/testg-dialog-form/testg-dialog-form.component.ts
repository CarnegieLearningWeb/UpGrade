import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface FormData {
  name: string;
}

@Component({
  selector: 'app-testg-dialog-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, MatFormField, MatInputModule],
  templateUrl: './testg-dialog-form.component.html',
  styleUrl: './testg-dialog-form.component.scss',
})
export class TestgDialogFormComponent {
  form = this.fb.group({
    name: [''],
  });

  constructor(private fb: FormBuilder) {}
}
