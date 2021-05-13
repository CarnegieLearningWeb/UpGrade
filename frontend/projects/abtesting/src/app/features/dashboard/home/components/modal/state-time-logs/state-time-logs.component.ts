import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { ExperimentVM } from '../../../../../../core/experiments/store/experiments.model';

@Component({
  selector: 'app-state-time-logs',
  templateUrl: './state-time-logs.component.html',
  styleUrls: ['./state-time-logs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StateTimeLogsComponent implements OnInit {

  timeLogDisplayedColumns = ['timeLogNumber', 'startTime', 'endTime']
  experiment: ExperimentVM;

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
    console.log('----------experiment data----', this.experiment);
    this.startTimeLogs = this.experiment.stateTimeLogs.filter(state => state.toState==='enrolling');
    this.endTimeLogs = this.experiment.stateTimeLogs.filter(state => state.fromState==='enrolling');
    
    this.startTimeLogs.forEach((startTimeLog, idx)=>{
      const endTimeLog = idx < this.endTimeLogs.length ?  this.endTimeLogs[idx].timeLog : null;
      this.filtered_timeLog.push({startTimeLog: startTimeLog.timeLog, endTimeLog: endTimeLog});
    });
  } 
}
