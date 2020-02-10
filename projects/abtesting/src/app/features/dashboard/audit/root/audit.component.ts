import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { AuditService } from '../../../../core/audit/audit.service';
import * as groupBy from 'lodash.groupby';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-audit',
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuditComponent implements OnInit, OnDestroy {

  logs: any;
  logsSubscription: Subscription;
  constructor(private auditService: AuditService) { }

  ngOnInit() {
    this.logsSubscription = this.auditService.getAuditLogs().subscribe(logs => {
      logs.sort((a, b) =>
         (a.createdAt > b.createdAt) ? -1 : ((a.createdAt < b.createdAt) ? 1 : 0)
      );
      this.logs = groupBy(logs, (log) => {
        const date = new Date(log.createdAt);
        return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
      });
    });
  }

  ngOnDestroy() {
    this.logsSubscription.unsubscribe();
  }
}
