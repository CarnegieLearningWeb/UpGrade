import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { LogType } from '../../../../core/audit/store/audit.model';

@Component({
  selector: 'audit-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimelineComponent {

  @Input() logData;
  @Input() logType;

  get LogType() {
    return LogType;
  }
}
