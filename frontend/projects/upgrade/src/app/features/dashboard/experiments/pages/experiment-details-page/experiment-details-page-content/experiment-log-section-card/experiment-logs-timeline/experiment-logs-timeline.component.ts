import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { LOG_TYPE, EXPERIMENT_LIST_OPERATION } from 'upgrade_types';
import { ExperimentLogMessagePipe } from '../pipes/experiment-log-message.pipe';
import { ListOperationMessagePipe } from '../pipes/list-operation-message.pipe';
import { ExperimentLogDiffDisplayComponent } from '../experiment-log-diff-display/experiment-log-diff-display.component';
import { AuditLogs } from '../../../../../../../../core/logs/store/logs.model';
import Convert from 'ansi-to-html';

/**
 * Timeline component for displaying experiment-specific audit logs.
 * Simplified version that removes redundant experiment references since we're viewing a specific experiment.
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
    TranslateModule,
    ExperimentLogDiffDisplayComponent,
    ExperimentLogMessagePipe,
    ListOperationMessagePipe,
  ],
})
export class ExperimentLogsTimelineComponent {
  @Input() logData: AuditLogs[];

  systemUserEmail = 'system@gmail.com';

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

  getHtmlFormedLogData(id: string, diff) {
    const convert = new Convert();
    let convertedToHtml = convert.toHtml(diff);
    convertedToHtml = convertedToHtml.split('color:#FFF').join('color: grey');
    const diffNode = document.getElementById(id);
    const html = new DOMParser().parseFromString(convertedToHtml, 'text/html');
    if (diffNode) {
      diffNode.innerHTML = html.body.innerHTML;
    }
  }
}
