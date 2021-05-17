import { Component, OnInit, ChangeDetectionStrategy, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { ExperimentVM, EXPERIMENT_STATE } from '../../../../../../core/experiments/store/experiments.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-state-time-logs',
  templateUrl: './state-time-logs.component.html',
  styleUrls: ['./state-time-logs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StateTimeLogsComponent implements OnInit, OnDestroy {

  timeLogDisplayedColumns = ['timeLogNumber', 'startTime', 'endTime']
  experiment: ExperimentVM;
  experimentSub: Subscription;

  startTimeLogs = [];
  endTimeLogs = [];
  filtered_timeLog = [];

  constructor(
    private experimentService: ExperimentService,
    public dialogRef: MatDialogRef<StateTimeLogsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.experiment = this.data.experiment;
  }

  ngOnInit() {
    this.experimentSub = this.experimentService.selectExperimentById(this.experiment.id).subscribe(experiment => {
      //this.experiment = experiment;
      if(this.experiment.stateTimeLogs){
        this.startTimeLogs = experiment.stateTimeLogs.filter(state => state.toState===EXPERIMENT_STATE.ENROLLING);
        this.endTimeLogs = experiment.stateTimeLogs.filter(state => state.fromState===EXPERIMENT_STATE.ENROLLING);
      }
     // console.log('----- subscription of stateChanges and data below----');
     // console.log(experiment.stateTimeLogs);
    });

    
    
    this.startTimeLogs.sort((a, b) => {
      const d1 = new Date(a.timeLog);
      const d2 = new Date(b.timeLog);
      return d1 > d2 ? 1 : d1 < d2 ? -1 : 0;
    });

    this.endTimeLogs.sort((a, b) => {
      const d1 = new Date(a.timeLog);
      const d2 = new Date(b.timeLog);
      return d1 > d2 ? 1 : d1 < d2 ? -1 : 0;
    });

    this.startTimeLogs.forEach((startTimeLog, idx)=>{
      const endTimeLog = idx < this.endTimeLogs.length ?  this.endTimeLogs[idx].timeLog : null;
      this.filtered_timeLog.push({startTimeLog: startTimeLog.timeLog, endTimeLog: endTimeLog});
    });
  }

  ngOnDestroy() {
    this.experimentSub.unsubscribe();

  }
}
