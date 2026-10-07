import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';

/** Presentational selection control; the parent owns row/header selection and permissions. */
@Component({
  selector: 'app-common-selection-checkbox',
  imports: [MatCheckboxModule, MatTooltipModule],
  templateUrl: './common-selection-checkbox.component.html',
  styleUrl: './common-selection-checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonSelectionCheckboxComponent {
  @Input() checked = false;
  @Input() indeterminate = false;
  @Input() disabled = false;
  @Input() ariaLabel = '';
  @Input() tooltip = '';
  @Output() toggle = new EventEmitter<void>();
}
