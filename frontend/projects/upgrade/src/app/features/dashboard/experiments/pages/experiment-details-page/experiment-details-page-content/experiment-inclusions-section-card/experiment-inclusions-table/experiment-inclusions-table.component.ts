import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-experiment-inclusions-table',
  imports: [CommonModule, TranslateModule],
  templateUrl: './experiment-inclusions-table.component.html',
  styleUrl: './experiment-inclusions-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentInclusionsTableComponent {
  // TODO: Implement inclusions table functionality using CommonDetailsParticipantListTableComponent
}
