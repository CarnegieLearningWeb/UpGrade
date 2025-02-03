import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { LogsService } from '../../../../core/logs/logs.service';
import { LOG_TYPE, SERVER_ERROR } from 'upgrade_types';
import { ENV, Environment } from '../../../../../environments/environment-types';

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss'],
  standalone: false,
})
export class LogsComponent implements OnInit, OnDestroy {
  // Audit log tab filter options
  auditLogsOptions = [
    { value: 'all', viewValue: 'All' },
    { value: LOG_TYPE.EXPERIMENT_CREATED, viewValue: 'Experiment Created' },
    { value: LOG_TYPE.EXPERIMENT_UPDATED, viewValue: 'Experiment Updated' },
    { value: LOG_TYPE.EXPERIMENT_STATE_CHANGED, viewValue: 'Experiment State Changed' },
    { value: LOG_TYPE.EXPERIMENT_DELETED, viewValue: 'Experiment Deleted' },
    { value: LOG_TYPE.EXPERIMENT_DATA_EXPORTED, viewValue: 'Experiment Data Exported' },
    { value: LOG_TYPE.EXPERIMENT_DESIGN_EXPORTED, viewValue: 'Experiment Design Exported' },
    { value: LOG_TYPE.FEATURE_FLAG_CREATED, viewValue: 'Feature Flag Created' },
    { value: LOG_TYPE.FEATURE_FLAG_UPDATED, viewValue: 'Feature Flag Updated' },
    { value: LOG_TYPE.FEATURE_FLAG_STATUS_CHANGED, viewValue: 'Feature Flag Status Changed' },
    { value: LOG_TYPE.FEATURE_FLAG_DELETED, viewValue: 'Feature Flag Deleted' },
    { value: LOG_TYPE.FEATURE_FLAG_DATA_EXPORTED, viewValue: 'Feature Flag Data Exported' },
    { value: LOG_TYPE.FEATURE_FLAG_DESIGN_EXPORTED, viewValue: 'Feature Flag Design Exported' },
  ];

  // Error log tab filter options
  errorLogsOptions = [
    { value: 'all', viewValue: 'All' },
    { value: SERVER_ERROR.DB_AUTH_FAIL, viewValue: SERVER_ERROR.DB_AUTH_FAIL },
    { value: SERVER_ERROR.ASSIGNMENT_ERROR, viewValue: SERVER_ERROR.ASSIGNMENT_ERROR },
    { value: SERVER_ERROR.MISSING_PARAMS, viewValue: SERVER_ERROR.MISSING_PARAMS },
    { value: SERVER_ERROR.INCORRECT_PARAM_FORMAT, viewValue: SERVER_ERROR.INCORRECT_PARAM_FORMAT },
    { value: SERVER_ERROR.USER_NOT_FOUND, viewValue: SERVER_ERROR.USER_NOT_FOUND },
    { value: SERVER_ERROR.QUERY_FAILED, viewValue: SERVER_ERROR.QUERY_FAILED },
    { value: SERVER_ERROR.REPORTED_ERROR, viewValue: SERVER_ERROR.REPORTED_ERROR },
    { value: SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED, viewValue: SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED },
    {
      value: SERVER_ERROR.EXPERIMENT_USER_GROUP_NOT_DEFINED,
      viewValue: SERVER_ERROR.EXPERIMENT_USER_GROUP_NOT_DEFINED,
    },
    {
      value: SERVER_ERROR.WORKING_GROUP_NOT_SUBSET_OF_GROUP,
      viewValue: SERVER_ERROR.WORKING_GROUP_NOT_SUBSET_OF_GROUP,
    },
    { value: SERVER_ERROR.INVALID_TOKEN, viewValue: SERVER_ERROR.INVALID_TOKEN },
    { value: SERVER_ERROR.TOKEN_NOT_PRESENT, viewValue: SERVER_ERROR.TOKEN_NOT_PRESENT },
    { value: SERVER_ERROR.EMAIL_SEND_ERROR, viewValue: SERVER_ERROR.EMAIL_SEND_ERROR },
    { value: SERVER_ERROR.CONDITION_NOT_FOUND, viewValue: SERVER_ERROR.CONDITION_NOT_FOUND },
  ];
  filterOptions = [];
  selectedFilterOption: string;
  // Used to persist previous tab filter option
  selectedOptionForAnotherTab: string;
  selectedTabIndex: number;
  constructor(private logsService: LogsService, @Inject(ENV) public environment: Environment) {}

  ngOnInit() {
    // Initially audit log filters will be set
    this.selectedFilterOption = this.auditLogsOptions[0].value;
    this.selectedOptionForAnotherTab = this.selectedFilterOption;
    this.filterOptions = this.auditLogsOptions;
    this.selectedTabIndex = 0;

    this.logsService.fetchAuditLogs(true);
    this.logsService.fetchErrorLogs(true);
  }

  selectedIndexChange(tabIndex: number) {
    this.selectedTabIndex = tabIndex;
    this.filterOptions = tabIndex === 0 ? this.auditLogsOptions : this.errorLogsOptions;

    // Swap selected filter option
    [this.selectedFilterOption, this.selectedOptionForAnotherTab] = [
      this.selectedOptionForAnotherTab,
      this.selectedFilterOption,
    ];
  }

  changeLogOption(value: any) {
    value = value === 'all' ? null : value;
    if (this.selectedTabIndex === 0) {
      this.logsService.setAuditLogFilter(value);
    } else {
      this.logsService.setErrorLogFilter(value);
    }
  }

  ngOnDestroy() {
    this.logsService.setAuditLogFilter(null);
    this.logsService.setErrorLogFilter(null);
  }
}
