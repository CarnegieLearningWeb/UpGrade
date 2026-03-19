import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardSearchHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FeatureFlagsService } from '../../../../../../../core/feature-flags/feature-flags.service';
import { FeatureFlag } from '../../../../../../../core/feature-flags/store/feature-flags.model';
import { LogsService } from '../../../../../../../core/logs/logs.service';
import { SharedModule } from '../../../../../../../shared/shared.module';
import { CommonAuditLogTimelineComponent } from '../../../../../../../shared-standalone-component-lib/components/common-audit-log-timeline/common-audit-log-timeline.component';
import { AuditLogs } from '../../../../../../../core/logs/store/logs.model';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';
import { AuditLogTimelineConfig } from '../../../../../../../shared-standalone-component-lib/components/common-audit-log-timeline/common-audit-log-timeline-config.model';
import { FEATURE_FLAG_TIMELINE_LOG_TYPE_CONFIG } from '../../../../../../../shared-standalone-component-lib/components/common-audit-log-timeline/configs/feature-flag-timeline.config';
import { CommonLogSectionCardBase } from '../../../../../../../shared-standalone-component-lib/components/common-log-section-card/common-log-section-card.base';

@Component({
  selector: 'app-feature-flag-log-section-card',
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
  templateUrl: './feature-flag-log-section-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagLogSectionCardComponent extends CommonLogSectionCardBase {
  timelineConfig: AuditLogTimelineConfig = FEATURE_FLAG_TIMELINE_LOG_TYPE_CONFIG;

  get selectedEntity$(): Observable<FeatureFlag> {
    return this.featureFlagsService.selectedFeatureFlag$;
  }

  constructor(private readonly featureFlagsService: FeatureFlagsService, private readonly logsService: LogsService) {
    super();
  }

  fetchLogs(id: string, isInitial?: boolean): void {
    this.logsService.fetchFeatureFlagLogs(id, isInitial);
  }

  getLogsById(id: string): Observable<AuditLogs[]> {
    return this.logsService.getFeatureFlagLogsById(id);
  }

  getLogsLoadingState(id: string): Observable<boolean> {
    return this.logsService.getFeatureFlagLogsLoadingState(id);
  }

  isAllEntityLogsFetched(id: string): Observable<boolean> {
    return this.logsService.isAllFeatureFlagLogsFetched(id);
  }
}
