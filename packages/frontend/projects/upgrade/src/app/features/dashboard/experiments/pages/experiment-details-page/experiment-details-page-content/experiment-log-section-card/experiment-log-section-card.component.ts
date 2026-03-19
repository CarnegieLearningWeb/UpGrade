import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardSearchHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ExperimentService } from '../../../../../../../core/experiments/experiments.service';
import { Experiment } from '../../../../../../../core/experiments/store/experiments.model';
import { LogsService } from '../../../../../../../core/logs/logs.service';
import { SharedModule } from '../../../../../../../shared/shared.module';
import { CommonAuditLogTimelineComponent } from '../../../../../../../shared-standalone-component-lib/components/common-audit-log-timeline/common-audit-log-timeline.component';
import { AuditLogs } from '../../../../../../../core/logs/store/logs.model';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';
import { AuditLogTimelineConfig } from '../../../../../../../shared-standalone-component-lib/components/common-audit-log-timeline/common-audit-log-timeline-config.model';
import { EXPERIMENT_TIMELINE_LOG_TYPE_CONFIG } from '../../../../../../../shared-standalone-component-lib/components/common-audit-log-timeline/configs/experiment-timeline.config';
import { CommonLogSectionCardBase } from '../../../../../../../shared-standalone-component-lib/components/common-log-section-card/common-log-section-card.base';

@Component({
  selector: 'app-experiment-log-section-card',
  imports: [
    CommonModule,
    CommonSectionCardComponent,
    CommonSectionCardActionButtonsComponent,
    CommonSectionCardSearchHeaderComponent,
    TranslateModule,
    SharedModule,
    CommonAuditLogTimelineComponent,
    MatProgressSpinnerModule,
  ],
  standalone: true,
  templateUrl: './experiment-log-section-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentLogSectionCardComponent extends CommonLogSectionCardBase {
  timelineConfig: AuditLogTimelineConfig = EXPERIMENT_TIMELINE_LOG_TYPE_CONFIG;

  get selectedEntity$(): Observable<Experiment> {
    return this.experimentService.selectedExperiment$;
  }

  constructor(private readonly experimentService: ExperimentService, private readonly logsService: LogsService) {
    super();
  }

  fetchLogs(id: string, isInitial?: boolean): void {
    this.logsService.fetchExperimentLogs(id, isInitial);
  }

  getLogsById(id: string): Observable<AuditLogs[]> {
    return this.logsService.getExperimentLogsById(id);
  }

  getLogsLoadingState(id: string): Observable<boolean> {
    return this.logsService.getExperimentLogsLoadingState(id);
  }

  isAllEntityLogsFetched(id: string): Observable<boolean> {
    return this.logsService.isAllExperimentLogsFetched(id);
  }
}
