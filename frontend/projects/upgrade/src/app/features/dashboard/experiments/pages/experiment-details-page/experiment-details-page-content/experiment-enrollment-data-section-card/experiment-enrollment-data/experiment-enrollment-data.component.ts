import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-experiment-enrollment-data',
  imports: [CommonModule, TranslateModule],
  templateUrl: './experiment-enrollment-data.component.html',
  styleUrl: './experiment-enrollment-data.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentEnrollmentDataComponent {
  // TODO: Implement enrollment data functionality
}
