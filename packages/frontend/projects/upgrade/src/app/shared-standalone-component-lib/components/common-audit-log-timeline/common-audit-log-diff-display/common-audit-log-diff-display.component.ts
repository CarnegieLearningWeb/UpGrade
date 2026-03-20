import { Component, ChangeDetectionStrategy, Input, AfterViewInit } from '@angular/core';

import { MatExpansionModule } from '@angular/material/expansion';
import { TranslateModule } from '@ngx-translate/core';
import Convert from 'ansi-to-html';

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
  imports: [MatExpansionModule, TranslateModule],
})
export class CommonAuditLogDiffDisplayComponent implements AfterViewInit {
  @Input() logId: string;
  @Input() logData: any;
  @Input() logType: string;
  @Input() actionMessage: string;

  ngAfterViewInit(): void {
    // Convert ANSI-formatted diff to HTML after view is initialized
    if (this.hasDiff) {
      setTimeout(() => {
        this.renderDiff();
      }, 0);
    }
  }

  get hasDiff(): boolean {
    return !!(this.logData?.diff || this.logData?.list?.diff);
  }

  get diffContent(): string {
    return this.logData?.list?.diff || this.logData?.diff || '';
  }

  renderDiff(): void {
    const convert = new Convert();
    let convertedToHtml = convert.toHtml(this.diffContent);
    convertedToHtml = convertedToHtml.split('color:#FFF').join('color: grey');

    const diffNode = document.getElementById(`diff-${this.logId}`);
    if (diffNode) {
      const html = new DOMParser().parseFromString(convertedToHtml, 'text/html');
      diffNode.innerHTML = html.body.innerHTML;
    }
  }
}
