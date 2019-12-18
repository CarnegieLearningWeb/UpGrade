import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'home-experiment-schedule',
  templateUrl: './experiment-schedule.component.html',
  styleUrls: ['./experiment-schedule.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentScheduleComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
