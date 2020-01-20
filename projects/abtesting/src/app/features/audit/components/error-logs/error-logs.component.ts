import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'error-logs',
  templateUrl: './error-logs.component.html',
  styleUrls: ['./error-logs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorLogsComponent implements OnInit {

  searchValue: string;
  logsOptions = [
    { value: 'Showing all Activities', viewValue: 'Showing all Activities' },
  ];
  selectedLogOption = this.logsOptions[0].value;
  constructor() { }

  ngOnInit() {
  }

  searchLogs(value: string) {}

  changeLogOption(value: string) {}

}
