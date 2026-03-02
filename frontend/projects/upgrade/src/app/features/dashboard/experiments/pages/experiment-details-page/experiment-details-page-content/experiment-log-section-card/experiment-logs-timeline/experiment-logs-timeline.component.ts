import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { LOG_TYPE, EXPERIMENT_LIST_OPERATION } from 'upgrade_types';
import { ExperimentLogDiffDisplayComponent } from '../experiment-log-diff-display/experiment-log-diff-display.component';
import { User } from '../../../../../../../../core/users/store/users.model';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SharedModule } from '../../../../../../../../shared/shared.module';
import { AuditLogs, LogDateFormatType } from '../../../../../../../../core/logs/store/logs.model';

/**
 * Timeline component for displaying experiment-specific audit logs.
 */
@Component({
  selector: 'app-experiment-logs-timeline',
  templateUrl: './experiment-logs-timeline.component.html',
  styleUrls: ['./experiment-logs-timeline.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatExpansionModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    TranslateModule,
    ExperimentLogDiffDisplayComponent,
    SharedModule,
  ],
})
export class ExperimentLogsTimelineComponent {
  @Input() groupedLogs: { dates: string[]; dateGroups: Record<string, AuditLogs[]> };
  @Input() isLoading = false;
  @Input() isEmpty = false;
  @Output() scrolledToBottom = new EventEmitter<void>();

  systemUserEmail = 'system@gmail.com';
  LogDateFormatType = LogDateFormatType;

  get ExperimentLogType() {
    return LOG_TYPE;
  }

  get EXPERIMENT_LIST_OPERATION() {
    return EXPERIMENT_LIST_OPERATION;
  }

  logTypeMessageMap = {
    [LOG_TYPE.EXPERIMENT_CREATED]: 'logs.audit-log-experiment-created.text',
    [LOG_TYPE.EXPERIMENT_DELETED]: 'logs.audit-log-experiment-deleted.text',
    [LOG_TYPE.EXPERIMENT_STATE_CHANGED]: 'logs.audit-log-experiment-state-changed.text',
    [LOG_TYPE.EXPERIMENT_UPDATED]: 'logs.audit-log-experiment-updated.text',
    [LOG_TYPE.EXPERIMENT_DATA_EXPORTED]: 'logs.audit-log-experiment-data-exported.text',
    [LOG_TYPE.EXPERIMENT_DESIGN_EXPORTED]: 'logs.audit-log-experiment-design-exported.text',
    [LOG_TYPE.FEATURE_FLAG_CREATED]: 'logs.audit-log-feature-flag-created.text',
    [LOG_TYPE.FEATURE_FLAG_DELETED]: 'logs.audit-log-feature-flag-deleted.text',
    [LOG_TYPE.FEATURE_FLAG_STATUS_CHANGED]: 'logs.audit-log-feature-flag-state-changed.text',
    [LOG_TYPE.FEATURE_FLAG_UPDATED]: 'logs.audit-log-feature-flag-updated.text',
    [LOG_TYPE.FEATURE_FLAG_DATA_EXPORTED]: 'logs.audit-log-feature-flag-data-exported.text',
    [LOG_TYPE.FEATURE_FLAG_DESIGN_EXPORTED]: 'logs.audit-log-feature-flag-design-exported.text',
  };

  listOperationMessageMap = {
    [EXPERIMENT_LIST_OPERATION.CREATED]: 'logs.audit-log-list-created.text',
    [EXPERIMENT_LIST_OPERATION.DELETED]: 'logs.audit-log-list-deleted.text',
    [EXPERIMENT_LIST_OPERATION.UPDATED]: 'logs.audit-log-list-updated.text',
  };

  hasDiff(log: AuditLogs): boolean {
    return !!(log.data?.diff || log.data?.list?.diff);
  }

  // User-related helpers
  getUserFullName(user: User): string {
    if (!user?.firstName && !user?.lastName) return '';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }

  isSystemUser(user: User): boolean {
    return user?.email === this.systemUserEmail;
  }

  hasUserImage(user: User): boolean {
    return !!user?.imageUrl;
  }

  shouldTruncateUserName(user: User): boolean {
    return this.getUserFullName(user).length >= 30;
  }

  isSimpleLogType(type: LOG_TYPE): boolean {
    return [
      LOG_TYPE.EXPERIMENT_DELETED,
      LOG_TYPE.EXPERIMENT_DATA_EXPORTED,
      LOG_TYPE.EXPERIMENT_DESIGN_EXPORTED,
    ].includes(type);
  }

  isStateChangeOrCreated(type: LOG_TYPE): boolean {
    return type === LOG_TYPE.EXPERIMENT_STATE_CHANGED || type === LOG_TYPE.EXPERIMENT_CREATED;
  }

  getListTableType(filterType: string): string {
    return filterType === 'inclusion' ? 'include' : 'exclude';
  }

  onScrolledToBottom(): void {
    this.scrolledToBottom.emit();
  }
}
