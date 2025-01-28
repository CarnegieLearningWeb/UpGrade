import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FeatureFlagsService } from '../../../../../../../../core/feature-flags/feature-flags.service';
import { CommonDetailsParticipantListTableComponent } from '../../../../../../../../shared-standalone-component-lib/components/common-details-participant-list-table/common-details-participant-list-table.component';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-feature-flag-exposures-data',
    templateUrl: './feature-flag-exposures-data.component.html',
    styleUrl: './feature-flag-exposures-data.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonDetailsParticipantListTableComponent, CommonModule, TranslateModule]
})
export class FeatureFlagExposuresDataComponent {}
