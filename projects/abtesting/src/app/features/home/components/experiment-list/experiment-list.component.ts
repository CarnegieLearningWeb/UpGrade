import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-experiment-list',
  templateUrl: './experiment-list.component.html',
  styleUrls: ['./experiment-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentListComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
