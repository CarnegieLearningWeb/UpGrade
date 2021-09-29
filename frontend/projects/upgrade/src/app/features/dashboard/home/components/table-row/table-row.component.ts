import { Component, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ExperimentVM } from '../../../../../core/experiments/store/experiments.model';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-table-row',
  templateUrl: './table-row.component.html',
  styleUrls: ['./table-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('expandableRow', [
      state('collapsed, void', style({
        height: '0px',
        visibility: 'hidden'
      })),
      state('expanded', style({
        'min-height': '48px',
        height: '*',
        visibility: 'visible'
      })),
      transition(
        'expanded <=> collapsed, void <=> *',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ])
  ]
})
export class TableRowComponent implements OnDestroy {
  @Input() dataSource: any;
  @Input() displayedColumns: string[];
  @Input() referenceId: string;
  @Input() experiment: ExperimentVM;

  expandedId = '';
  columnHeaders: {};
  translateSub: Subscription;
  constructor(
    private translate: TranslateService
  ) {
    this.translateSub = this.translate.get([
      'global.condition.text',
      'home.view-experiment.global.weight.text',
      'home.view-experiment.global.users-enrolled.text',
      'home.view-experiment.global.group-enrolled.text',
      'home.view-experiment-global.experiment-point.text',
      'home.view-experiment-global.experiment-partition.text'
    ]).subscribe(arrayValues => {
      this.columnHeaders = {
        condition: arrayValues['global.condition.text'],
        weight: arrayValues['home.view-experiment.global.weight.text'],
        userEnrolled: arrayValues['home.view-experiment.global.users-enrolled.text'],
        groupEnrolled: arrayValues['home.view-experiment.global.group-enrolled.text'],
        experimentPoint: arrayValues['home.view-experiment-global.experiment-point.text'],
        experimentId: arrayValues['home.view-experiment-global.experiment-partition.text'],
      }
    })
  }

  toggleExpandableSymbol(id: string): void {
    this.expandedId = this.expandedId === id ? '' : id;
  }

  ngOnDestroy() {
    this.translateSub.unsubscribe();
  }
}
