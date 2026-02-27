import { Component, ChangeDetectionStrategy, Input, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { TranslateModule } from '@ngx-translate/core';
import { LOG_TYPE } from 'upgrade_types';
import Convert from 'ansi-to-html';

/**
 * Sub-component for displaying diffs in experiment logs.
 */
@Component({
  selector: 'app-experiment-log-diff-display',
  templateUrl: './experiment-log-diff-display.component.html',
  styleUrls: ['./experiment-log-diff-display.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, MatExpansionModule, TranslateModule],
})
export class ExperimentLogDiffDisplayComponent implements AfterViewInit {
  @Input() logId: string;
  @Input() logData: any;
  @Input() logType: LOG_TYPE;
  @Input() createdAt: string;
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
