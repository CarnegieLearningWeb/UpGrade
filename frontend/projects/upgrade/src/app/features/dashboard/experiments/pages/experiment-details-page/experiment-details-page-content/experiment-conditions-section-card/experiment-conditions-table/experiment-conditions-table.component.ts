import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-experiment-conditions-table',
  imports: [CommonModule, TranslateModule],
  templateUrl: './experiment-conditions-table.component.html',
  styleUrl: './experiment-conditions-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentConditionsTableComponent {
  // TODO: Implement conditions table functionality
}
