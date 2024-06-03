import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

/**
 * A component nested in this component can be displayed in the **header** or **content** slot.
 * The **header** slot should contain a component that wraps a **app-common-page-header**.
 * The **content** slot should contain a component that wraps a list of **app-common-section-card**.
 * Simply nest the component and add the slot name as an attribute.
 *
 * Example usage:
 *
 * ```
 * <app-common-page>
 *   <div header>Hi I'm in the header slot</div>
 *   <div content>Hi I'm in the content slot</div>
 * </app-common-page>
 * ```
 */
@Component({
  selector: 'app-common-page',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './common-page.component.html',
  styleUrl: './common-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonPageComponent {}
