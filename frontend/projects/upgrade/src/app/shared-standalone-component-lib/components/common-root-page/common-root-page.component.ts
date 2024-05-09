import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CommonRootPageHeaderContainerComponent } from '../common-root-page-header-container/common-root-page-header-container.component';

/**
 * A component nested in this component can be displayed in the **header** or **content** slot.
 * The **header** slot should contain a component that wraps a **app-common-root-page-header**.
 * The **content** slot should contain a component that wraps a **app-common-section-card-list**.
 * Simply nest the component and add the slot name as an attribute.
 *
 * Example usage:
 *
 * ```
 * <app-common-root-page>
 *   <div header>Hi I'm in the header slot</div>
 *   <div content>Hi I'm in the content slot</div>
 * </app-common-root-page>
 * ```
 */
@Component({
  selector: 'app-common-root-page',
  standalone: true,
  imports: [CommonModule, TranslateModule, CommonRootPageHeaderContainerComponent],
  templateUrl: './common-root-page.component.html',
  styleUrl: './common-root-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonRootPageComponent {}
