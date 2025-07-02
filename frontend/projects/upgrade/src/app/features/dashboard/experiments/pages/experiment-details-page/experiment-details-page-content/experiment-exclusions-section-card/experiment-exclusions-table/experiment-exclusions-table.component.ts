import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-experiment-exclusions-table',
  imports: [CommonModule, TranslateModule],
  templateUrl: './experiment-exclusions-table.component.html',
  styleUrl: './experiment-exclusions-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentExclusionsTableComponent {
  // TODO: Implement exclusions table functionality using CommonDetailsParticipantListTableComponent
}
