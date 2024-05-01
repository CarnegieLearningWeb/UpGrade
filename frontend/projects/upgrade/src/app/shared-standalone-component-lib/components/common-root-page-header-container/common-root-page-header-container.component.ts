import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';

/**
 * A component nested in this component can be displayed in the **header** or **content** slot.
 * The **header** slot should contain a component that wraps a **app-common-root-page-header**.
 * The **content** slot should contain a component that wraps a **app-common-root-section-card-list**.
 * Simply nest the component and add the slot name as an attribute.
 *
 * Example usage:
 *
 * ```
 * < header>Hi I'm in the header slot</div>
 * <div content>Hi I'm in the content slot</div>
 * ```
 */
@Component({
  selector: 'app-common-root-page-header-container',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatButton],
  templateUrl: './common-root-page-header-container.component.html',
  styleUrl: './common-root-page-header-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonRootPageHeaderContainerComponent {
  @Input() title!: string;
  @Input() subtitle!: string;
}
