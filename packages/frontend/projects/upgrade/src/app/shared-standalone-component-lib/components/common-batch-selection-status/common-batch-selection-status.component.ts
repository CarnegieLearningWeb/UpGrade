import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import type { RootBatchView } from '../../../shared/directives/root-batch-actions.directive';

@Component({
  selector: 'app-common-batch-selection-status',
  imports: [MatButtonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (view?.state.listRefreshFailed) {
    <div class="selection-status" role="alert">
      <span>{{ 'batch-delete.selection.list-refresh-failed' | translate }}</span>
      <button mat-button [disabled]="view.busy" (click)="reload.emit()">
        {{ 'batch-delete.selection.reload' | translate }}
      </button>
    </div>
    }
  `,
  styles: [
    `
      .selection-status {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        padding: 12px 32px 0;
        color: var(--dark-grey);
        font-size: 14px;
      }
    `,
  ],
})
export class CommonBatchSelectionStatusComponent {
  @Input() view: RootBatchView;
  @Output() reload = new EventEmitter<void>();
}
