import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuditLogTimelineConfig } from './common-audit-log-timeline-config.model';
import { CommonAuditLogDiffDisplayComponent } from './common-audit-log-diff-display/common-audit-log-diff-display.component';
import { SharedModule } from '../../../shared/shared.module';
import { AuditLogs, LogDateFormatType, SYSTEM_USER_EMAIL } from '../../../core/logs/store/logs.model';
import { User } from '../../../core/users/store/users.model';

/**
 * Generic timeline component for displaying audit logs for any entity type.
 * Configured via TimelineConfig to handle entity-specific behavior.
 */
@Component({
  selector: 'common-audit-log-timeline',
  templateUrl: './common-audit-log-timeline.component.html',
  styleUrls: ['./common-audit-log-timeline.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatExpansionModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    TranslateModule,
    CommonAuditLogDiffDisplayComponent,
    SharedModule,
  ],
})
export class CommonAuditLogTimelineComponent {
  @Input() groupedLogs: { dates: string[]; dateGroups: Record<string, AuditLogs[]> };
  @Input() isLoading = false;
  @Input() isEmpty = false;
  @Input() config: AuditLogTimelineConfig;
  @Output() scrolledToBottom = new EventEmitter<void>();

  LogDateFormatType = LogDateFormatType;

  hasDiff(log: AuditLogs): boolean {
    return !!(log.data?.diff || log.data?.list?.diff);
  }

  // User-related helpers
  getUserFullName(user: User): string {
    if (!user?.firstName && !user?.lastName) return '';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }

  isSystemUser(user: User): boolean {
    return user?.email === SYSTEM_USER_EMAIL;
  }

  hasUserImage(user: User): boolean {
    return !!user?.imageUrl;
  }

  shouldTruncateUserName(user: User): boolean {
    return this.getUserFullName(user).length >= 30;
  }

  // Entity-specific helpers (delegated to config)
  isSimpleLogType(type: string): boolean {
    return this.config?.isSimpleLogType(type) ?? false;
  }

  isStateChangeOrCreated(type: string): boolean {
    return this.config?.isStateChangeOrCreated(type) ?? false;
  }

  isUpdateLogType(type: string): boolean {
    // Use custom function if provided, otherwise check if it's not simple or state change
    if (this.config?.isUpdateLogType) {
      return this.config.isUpdateLogType(type);
    }
    return !this.isSimpleLogType(type) && !this.isStateChangeOrCreated(type);
  }

  hasListOperation(logData: AuditLogs[]): boolean {
    return this.config?.hasListOperation(logData) ?? false;
  }

  getListTableType(filterType: string): string {
    return filterType === 'inclusion' ? 'include' : 'exclude';
  }

  getLogTypeMessage(type: string): string {
    return this.config?.logTypeMessageMap?.[type] || '';
  }

  getListOperationMessage(operation: string): string {
    return this.config?.listOperationMessageMap?.[operation] || '';
  }

  onScrolledToBottom(): void {
    this.scrolledToBottom.emit();
  }
}
