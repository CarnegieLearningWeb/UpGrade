import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { EnrollmentConditionTableComponent } from '../enrollment-condition-table/enrollment-condition-table.component';
import { EnrollmentOverTimeComponent } from '../enrollment-over-time/enrollment-over-time.component';
import { ExperimentVM } from '../../../../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../../../../core/experiments/experiments.service';

@Component({
  selector: 'app-experiment-enrollment-data',
  imports: [CommonModule, TranslateModule, EnrollmentOverTimeComponent, EnrollmentConditionTableComponent],
  templateUrl: './experiment-enrollment-data.component.html',
  styleUrl: './experiment-enrollment-data.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentEnrollmentDataComponent implements OnInit {
  @Input() experiment: ExperimentVM;
  hasExperimentStarted$ = this.experimentsService.hasExperimentStarted$;

  constructor(private experimentsService: ExperimentService) {}
  ngOnInit(): void {
    this.experimentsService.fetchExperimentDetailStat(this.experiment.id);
  }
}
