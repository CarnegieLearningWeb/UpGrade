import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * A component nested in this component can be displayed in the **section-card** slot.
 * Multiple **section-card** slots can be nested and will appear in that order.
 *
 * Example usage:
 *
 * ```
 * <app-common-section-card-list>
 *   <div section-card>Hi I'm a section card 1</div>
 *   <div section-card>Hi I'm a section card 2</div>
 * </app-common-section-card-list>
 * ```
 */
@Component({
    selector: 'app-common-section-card-list',
    imports: [CommonModule],
    templateUrl: './common-section-card-list.component.html',
    styleUrl: './common-section-card-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommonSectionCardListComponent {}
