import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-common-root-page-header-container',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './common-root-page-header-container.component.html',
  styleUrl: './common-root-page-header-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class CommonRootPageHeaderContainerComponent {
  @Input() title!: string;
  @Input() subtitle!: string;
}
