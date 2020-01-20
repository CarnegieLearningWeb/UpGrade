import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'audit-logs',
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuditLogsComponent implements OnInit {

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
