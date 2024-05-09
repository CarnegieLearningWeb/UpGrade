import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CommonDetailsPageHeaderContainerComponent } from '../common-details-page-header-container/common-details-page-header-container.component';

/**
 * A component nested in this component can be displayed in the **header** or **content** slot.
 * The **header** slot should contain a component that wraps a **app-common-details-page-header**.
 * The **content** slot should contain a component that wraps a **app-common-section-card-list**.
 * Simply nest the component and add the slot name as an attribute.
 *
 * Example usage:
 *
 * ```
 * <app-common-details-page>
 *   <div header>Hi I'm in the header slot</div>
 *   <div content>Hi I'm in the content slot</div>
 * </app-common-details-page>
 * ```
 */
@Component({
  selector: 'app-common-details-page',
  standalone: true,
  imports: [CommonModule, TranslateModule, CommonDetailsPageHeaderContainerComponent],
  templateUrl: './common-details-page.component.html',
  styleUrl: './common-details-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonDetailsPageComponent {}
