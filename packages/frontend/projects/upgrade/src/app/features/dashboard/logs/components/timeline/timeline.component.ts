import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import * as env from '../../../../../../environments/environment';
import { LogType } from '../../../../../core/logs/store/logs.model';
import { EXPERIMENT_LIST_OPERATION, FEATURE_FLAG_LIST_OPERATION, LOG_TYPE, SERVER_ERROR } from 'upgrade_types';
import Convert from 'ansi-to-html';

@Component({
  selector: 'logs-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class TimelineComponent {
  @Input() logData;
  @Input() logType: LogType;
  // Used to change setting icon based on theme
  systemUserEmail = 'system@gmail.com';
  endPoint = env.environment.apiBaseUrl.substring(0, env.environment.apiBaseUrl.lastIndexOf('/'));

  get LogType() {
    return LogType;
  }

  get ExperimentLogType() {
    return LOG_TYPE;
  }

  get FEATURE_FLAG_LIST_OPERATION() {
    return FEATURE_FLAG_LIST_OPERATION;
  }

  get EXPERIMENT_LIST_OPERATION() {
    return EXPERIMENT_LIST_OPERATION;
  }

  get ServerErrors() {
    return SERVER_ERROR;
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
