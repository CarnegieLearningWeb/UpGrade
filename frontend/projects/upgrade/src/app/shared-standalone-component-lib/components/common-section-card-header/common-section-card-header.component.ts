import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-common-section-card-header',
  standalone: true,
  imports: [],
  templateUrl: './common-section-card-header.component.html',
  styleUrl: './common-section-card-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonSectionCardHeaderComponent {}
