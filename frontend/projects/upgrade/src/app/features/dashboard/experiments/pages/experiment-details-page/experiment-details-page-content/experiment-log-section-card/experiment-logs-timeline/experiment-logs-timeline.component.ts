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
    ExperimentLogMessagePipe,
    ListOperationMessagePipe,
    ExperimentLogDiffDisplayComponent,
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

  /**
   * Get formatted action message for a log entry
   */
  getActionMessage(log: AuditLogs): string {
    const baseMessage = this.getTranslatedMessage(log.type);

    if (log.type === LOG_TYPE.EXPERIMENT_UPDATED && log.data?.list) {
      const listOperation = this.getTranslatedListOperation(log.data.list.operation);
      const filterType = log.data.list.filterType === 'inclusion' ? 'include' : 'exclude';
      return `${baseMessage} - ${listOperation} (${filterType}: ${log.data.list.listName})`;
    }

    if (log.type === LOG_TYPE.EXPERIMENT_STATE_CHANGED) {
      const previousState = log.data?.previousState || '';
      const newState = log.data?.newState || '';
      return `${baseMessage} from ${previousState} to ${newState}`;
    }

    return baseMessage;
  }

  /**
   * Check if log has a diff to display
   */
  hasDiff(log: AuditLogs): boolean {
    return !!(log.data?.diff || log.data?.list?.diff);
  }

  private getTranslatedMessage(logType: LOG_TYPE): string {
    // These will be translated by the pipe in the template
    switch (logType) {
      case LOG_TYPE.EXPERIMENT_CREATED:
        return 'Created experiment';
      case LOG_TYPE.EXPERIMENT_DELETED:
        return 'Deleted experiment';
      case LOG_TYPE.EXPERIMENT_STATE_CHANGED:
        return 'Changed state';
      case LOG_TYPE.EXPERIMENT_UPDATED:
        return 'Updated experiment';
      case LOG_TYPE.EXPERIMENT_DATA_EXPORTED:
        return 'Exported experiment data';
      case LOG_TYPE.EXPERIMENT_DESIGN_EXPORTED:
        return 'Exported experiment design';
      default:
        return logType;
    }
  }

  private getTranslatedListOperation(operation: EXPERIMENT_LIST_OPERATION): string {
    switch (operation) {
      case EXPERIMENT_LIST_OPERATION.CREATED:
        return 'Created list';
      case EXPERIMENT_LIST_OPERATION.DELETED:
        return 'Deleted list';
      case EXPERIMENT_LIST_OPERATION.UPDATED:
        return 'Updated list';
      default:
        return operation;
    }
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
