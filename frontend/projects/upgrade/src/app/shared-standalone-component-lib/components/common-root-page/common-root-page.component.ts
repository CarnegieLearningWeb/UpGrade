import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-common-root-page',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './common-root-page.component.html',
  styleUrl: './common-root-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonRootPageComponent {
  @Input() public title = '';
  @Input() public subtitle = '';
}
