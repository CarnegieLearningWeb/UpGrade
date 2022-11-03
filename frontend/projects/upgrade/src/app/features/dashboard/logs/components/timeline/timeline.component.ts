import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import * as env from '../../../../../../environments/environment';
import { LogType, EXPERIMENT_LOG_TYPE, SERVER_ERROR } from '../../../../../core/logs/store/logs.model';
import Convert from 'ansi-to-html';
import { ThemeOptions } from '../../../../../core/settings/store/settings.model';

@Component({
  selector: 'logs-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineComponent {
  @Input() logData;
  @Input() logType: LogType;
  @Input() theme: ThemeOptions;
  // Used to change setting icon based on theme
  systemUserEmail = 'system@gmail.com';
  endPoint = env.environment.apiBaseUrl.substring(0, env.environment.apiBaseUrl.lastIndexOf('/'));

  get LogType() {
    return LogType;
  }

  get ExperimentLogType() {
    return EXPERIMENT_LOG_TYPE;
  }

  get ServerErrors() {
    return SERVER_ERROR;
  }

  get ThemeOptions() {
    return ThemeOptions;
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
