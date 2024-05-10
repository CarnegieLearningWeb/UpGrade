import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

/**
 * A component nested in this component can be displayed in the **header**, **content** or **footer** slot.
 * The **header** slot should contain a component that wraps a **app-common-section-card-header**.
 * The **content** slot should contain a component that wraps a **app-common-section-card-content**.
 * The **footer** slot should contain a component that wraps a **app-common-section-card-footer**.
 * Simply nest the component and add the slot name as an attribute.
 *
 * Example usage:
 *
 * ```
 * <app-common-section-card [hasFooter]="true">
 *   <div header>Hi I'm in the header slot</div>
 *   <div content>Hi I'm in the content slot</div>
 *   <div footer>Hi I'm in the content slot</div>
 * </app-common-section-card>
 * ```
 */
@Component({
  selector: 'app-common-section-card',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './common-section-card.component.html',
  styleUrl: './common-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonSectionCardComponent {
  @Input() hasFooter: boolean = false;
}
