import { MatCardModule } from '@angular/material/card';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogClose } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-common-dialog',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatDialogClose,
    CommonModule,
    MatIcon,
    TranslateModule,
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
  @Input() primaryActionBtnDisabled = false;
  @Output() primaryActionBtnClicked = new EventEmitter<string>();

  onPrimaryActionBtnClicked() {
    this.primaryActionBtnClicked.emit('primary action event');
  }
}
