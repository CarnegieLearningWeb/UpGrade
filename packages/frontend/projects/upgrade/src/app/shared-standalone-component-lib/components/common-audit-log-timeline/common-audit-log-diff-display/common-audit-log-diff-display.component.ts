import { Component, ChangeDetectionStrategy, Input, OnChanges } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { TranslateModule } from '@ngx-translate/core';
import { AuditLogDiffHelperService, DiffRow } from '../../../../core/logs/audit-log-diff.helper';

export type { DiffRow };

/**
 * Generic component for displaying diffs in audit logs.
 * Supports any entity type (experiments, feature flags, segments).
 */
@Component({
  selector: 'common-audit-log-diff-display',
  templateUrl: './common-audit-log-diff-display.component.html',
  styleUrls: ['./common-audit-log-diff-display.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgTemplateOutlet, MatExpansionModule, TranslateModule],
})
export class CommonAuditLogDiffDisplayComponent implements OnChanges {
  @Input() logId: string;
  @Input() logData: any;
  @Input() logType: string;
  @Input() actionMessage: string;
  @Input() wrapInAccordion = true;

  constructor(private diffHelper: AuditLogDiffHelperService) {}

  diffRows: DiffRow[] = [];

  get hasDiff(): boolean {
    return this.diffHelper.hasDiff(this.logData);
  }

  ngOnChanges(): void {
    if (this.diffHelper.hasDiff(this.logData)) {
      this.diffRows = this.diffHelper.parseDiff(this.diffHelper.getDiffContent(this.logData));
    }
  }
}
