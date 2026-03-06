import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

/**
 * A component nested in this component can be displayed in the **header**, **content** or **footer** slot.
 * The **header-left** slot should contain a search or title component.
 * The **header-right** slot should contain an action button component.
 * The **content** slot should contain a component that wraps a **app-common-section-card-content**.
 * The **footer** slot should contain a component that wraps a **app-common-section-card-footer**.
 * Simply nest the component and add the slot name as an attribute.
 *
 * Example usage:
 *
 * ```
 * <app-common-section-card>
 *   <div header-left>Hi I'm in the header left slot</div>
 *   <div header-right>Hi I'm in the header right slot</div>
 *   <div content>Hi I'm in the content slot</div>
 *   <div footer>Hi I'm in the footer slot</div>
 * </app-common-section-card>
 * ```
 */
@Component({
  selector: 'app-common-section-card',
  imports: [CommonModule, TranslateModule],
  templateUrl: './common-section-card.component.html',
  styleUrl: './common-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonSectionCardComponent {}
