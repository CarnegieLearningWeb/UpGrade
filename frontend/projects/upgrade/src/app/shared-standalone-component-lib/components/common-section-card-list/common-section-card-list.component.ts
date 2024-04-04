import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-common-section-card-list',
  standalone: true,
  imports: [],
  templateUrl: './common-section-card-list.component.html',
  styleUrl: './common-section-card-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonSectionCardListComponent {}
