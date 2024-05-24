import { MatCardModule } from '@angular/material/card';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { NgIf, NgTemplateOutlet } from '@angular/common';
import { MatIcon } from '@angular/material/icon';

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
    MatIcon,
  ],
  templateUrl: './common-modal.component.html',
  styleUrl: './common-modal.component.scss',
})
export class CommonModalComponent {
  @Input() title = '';
  @Input() cancelBtnLabel = 'Cancel';
  @Input() primaryActionBtnLabel = 'Submit';
  @Input() primaryActionBtnColor = 'primary';
  @Input() hideFooter = false;
  @Output() primaryActionBtnClicked = new EventEmitter<string>();

  onPrimaryActionBtnClicked() {
    console.log('Primary action button clicked');
    this.primaryActionBtnClicked.emit('primary action event');
  }
}
