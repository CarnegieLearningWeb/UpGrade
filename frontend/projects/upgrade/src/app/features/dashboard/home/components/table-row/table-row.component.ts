import { Component, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import { ExperimentVM } from '../../../../../core/experiments/store/experiments.model';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-table-row',
  templateUrl: './table-row.component.html',
  styleUrls: ['./table-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableRowComponent implements OnDestroy {
  @Input() dataSource: any;
  @Input() displayedColumns: string[];
  @Input() referenceId: string;
  @Input() experiment: ExperimentVM;

  expandedId = '';
  columnHeaders = {};
  translateSub: Subscription;
  constructor(private translate: TranslateService) {
    this.translateSub = this.translate
      .get([
        'global.condition.text',
        'home.view-experiment.global.weight.text',
        'home.view-experiment.global.users-enrolled.text',
        'home.view-experiment.global.group-enrolled.text',
        'home.view-experiment-global.experiment-site.text',
        'home.view-experiment-global.experiment-target.text',
      ])
      .subscribe((arrayValues) => {
        this.columnHeaders = {
          condition: arrayValues['global.condition.text'],
          weight: arrayValues['home.view-experiment.global.weight.text'],
          userEnrolled: arrayValues['home.view-experiment.global.users-enrolled.text'],
          groupEnrolled: arrayValues['home.view-experiment.global.group-enrolled.text'],
          experimentPoint: arrayValues['home.view-experiment-global.experiment-site.text'],
          experimentId: arrayValues['home.view-experiment-global.experiment-target.text'],
        };
      });
  }

  toggleExpandableSymbol(id: string): void {
    this.expandedId = this.expandedId === id ? '' : id;
  }

  ngOnDestroy() {
    this.translateSub.unsubscribe();
  }
}
