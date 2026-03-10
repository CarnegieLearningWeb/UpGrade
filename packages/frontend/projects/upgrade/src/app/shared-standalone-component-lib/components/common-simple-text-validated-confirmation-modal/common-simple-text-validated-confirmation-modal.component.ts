import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { CommonModalComponent } from '../common-modal/common-modal.component';
import { CommonModalConfig, TextValidatedConfirmationModalParams } from '../common-modal/common-modal.types';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { SharedModule } from '../../../shared/shared.module';

/**
 * CommonSimpleTextValidatedConfirmationModalComponent is a reusable modal component for confirmation dialogs
 * that require the user to type a specific keyword to enable the action button.
 *
 * It accepts a message, optional subMessage, and a validation keyword that must be typed exactly (case-insensitive).
 * The primary action button is disabled until the validation passes.
 * It will emit a boolean to the onClose event: true if confirmed, false if cancelled.
 *
 * Example usage:
 *
 * // In dialog service
 * openDeleteConfirmModal(itemName: string, isLoading$: Observable<boolean>) {
 *   const config: CommonModalConfig<TextValidatedConfirmationModalParams> = {
 *     title: 'Delete Item',
 *     primaryActionBtnLabel: 'Delete',
 *     primaryActionBtnColor: 'warn',
 *     cancelBtnLabel: 'Cancel',
 *     params: {
 *       message: `Are you sure you want to delete "${itemName}"?`,
 *       subMessage: '* This action cannot be undone.',
 *       subMessageClass: 'warn',
 *       validationKeyword: 'delete',
 *       validationPlaceholder: 'Type delete',
 *       isLoading$,
 *     },
 *   };
 *   return this.openTextValidatedConfirmationModal(config);
 * }
 *
 * // Handle in component
 * this.dialogService.openDeleteConfirmModal(item.name, this.isLoading$)
 *   .afterClosed()
 *   .subscribe((confirmed: boolean) => {
 *     if (confirmed) {
 *       // Perform delete action
 *     }
 *   });
 */
@Component({
  selector: 'common-simple-text-validated-confirmation-modal',
  imports: [CommonModalComponent, MatInputModule, FormsModule, TranslateModule, CommonModule, SharedModule],
  templateUrl: './common-simple-text-validated-confirmation-modal.component.html',
  styleUrl: './common-simple-text-validated-confirmation-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonSimpleTextValidatedConfirmationModalComponent {
  inputValue = '';
  private readonly inputSubject = new BehaviorSubject<string>('');
  private readonly internalLoading$ = new BehaviorSubject<boolean>(false);

  // Observable that emits true if validation fails (input doesn't match keyword)
  isValidationFailed$: Observable<boolean> = this.inputSubject.pipe(
    map((value) => value.trim().toLowerCase() !== this.data.params.validationKeyword.toLowerCase())
  );

  // Combined disabled state: disabled if validation fails OR if loading
  isPrimaryActionDisabled$: Observable<boolean> = combineLatest([
    this.isValidationFailed$,
    this.data.params.isLoading$ ?? this.internalLoading$,
  ]).pipe(map(([validationFailed, isLoading]) => validationFailed || isLoading));

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: CommonModalConfig<TextValidatedConfirmationModalParams>,
    public dialogRef: MatDialogRef<CommonSimpleTextValidatedConfirmationModalComponent>
  ) {}

  onInputChange(value: string): void {
    this.inputSubject.next(value);
  }

  onPrimaryActionBtnClicked() {
    this.dialogRef.close(true);
  }

  closeModal() {
    this.dialogRef.close(false);
  }

  get validationPrompt(): string {
    return `Type '${this.data.params.validationKeyword}' to confirm:`;
  }

  get validationPlaceholder(): string {
    return this.data.params.validationPlaceholder ?? `Type ${this.data.params.validationKeyword}`;
  }
}
