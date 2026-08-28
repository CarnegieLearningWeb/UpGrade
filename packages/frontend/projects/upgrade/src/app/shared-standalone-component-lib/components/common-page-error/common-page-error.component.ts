import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonPageErrorConfig, PAGE_ERROR_TYPE } from './common-page-error.model';

/**
 * Displays a full-page error state for pages whose data failed to load, such as a details page
 * for an entity that does not exist (not found) or could not be fetched (load failed).
 *
 * The `NOT_FOUND` variant shows a "back to list" button. The `LOAD_FAILED` variant additionally
 * shows a "Try Again" button that emits the `retry` event so the caller can re-dispatch its fetch.
 *
 * Example usage:
 *
 * ```html
 * <app-common-page-error
 *   [errorType]="error.errorType"
 *   [config]="pageErrorConfig"
 *   (retry)="onRetry(error.entityId)"
 * ></app-common-page-error>
 * ```
 */
@Component({
  selector: 'app-common-page-error',
  imports: [MatButtonModule, RouterModule, TranslateModule],
  templateUrl: './common-page-error.component.html',
  styleUrl: './common-page-error.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonPageErrorComponent {
  @Input() errorType: PAGE_ERROR_TYPE = PAGE_ERROR_TYPE.NOT_FOUND;
  @Input() config!: CommonPageErrorConfig;
  @Output() retry = new EventEmitter<void>();

  get isNotFound(): boolean {
    return this.errorType === PAGE_ERROR_TYPE.NOT_FOUND;
  }

  get icon(): string {
    return this.isNotFound ? 'search_off' : 'error';
  }

  get titleKey(): string {
    return this.isNotFound ? this.config.notFoundTitleKey : this.config.loadFailedTitleKey;
  }

  get subtitleKey(): string {
    return this.isNotFound ? this.config.notFoundSubtitleKey : this.config.loadFailedSubtitleKey;
  }
}
