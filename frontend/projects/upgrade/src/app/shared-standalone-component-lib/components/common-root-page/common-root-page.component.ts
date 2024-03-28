import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatCard } from '@angular/material/card';

@Component({
  selector: 'app-common-root-page',
  standalone: true,
  imports: [MatCard],
  templateUrl: './common-root-page.component.html',
  styleUrl: './common-root-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonRootPageComponent {
  @Input() public title = '';
  @Input() public subtitle = '';

  public sectionCards!: any[];
}
