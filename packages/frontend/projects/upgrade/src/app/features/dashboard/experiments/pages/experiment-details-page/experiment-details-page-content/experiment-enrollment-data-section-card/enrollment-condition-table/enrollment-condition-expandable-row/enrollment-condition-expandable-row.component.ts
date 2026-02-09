import { Component, ChangeDetectionStrategy, Input, OnDestroy, forwardRef } from '@angular/core';
import { ExperimentVM } from '../../../../../../../../../core/experiments/store/experiments.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { EnrollmentPointPartitionTableComponent } from '../enrollment-point-partition-table/enrollment-point-partition-table.component';

@Component({
  selector: 'app-enrollment-condition-expandable-row',
  templateUrl: './enrollment-condition-expandable-row.component.html',
  styleUrls: ['./enrollment-condition-expandable-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    CommonModule,
    MatTableModule,
    MatIconModule,
    forwardRef(() => EnrollmentPointPartitionTableComponent),
  ],
})
export class EnrollmentConditionExpandableRowComponent implements OnDestroy {
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
