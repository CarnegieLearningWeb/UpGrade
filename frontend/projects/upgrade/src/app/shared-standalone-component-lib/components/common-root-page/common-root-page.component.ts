import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CommonRootPageHeaderContainerComponent } from './child-components/common-root-page-header-container/common-root-page-header-container.component';

@Component({
  selector: 'app-common-root-page',
  standalone: true,
  imports: [CommonModule, TranslateModule, CommonRootPageHeaderContainerComponent],
  templateUrl: './common-root-page.component.html',
  styleUrl: './common-root-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonRootPageComponent {}
