import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

/**
 * A component nested in this component can be displayed in the **header** or **content** slot.
 * The **header** slot should contain a component that wraps a **app-common-page-header**.
 * The **section-card** slot should contain section-card components.
 * Simply nest the component and add the slot name as an attribute.
 *
 * Example usage:
 *
 * ```
 * <app-common-page>
 *   <div header>header</div>
 *   <div section-card>section-card 1</div>
 *   <div section-card>section-card 2</div>
 * </app-common-page>
 * ```
 *
 *
 * Tabbed / Conditional Output
 * ```
 * <app-common-page>
 *   <div header>header</div>
 *   <div section-card (selectedIndexChange)="selectedIndex = $event">overview-card-with-tabs</div>
 *    <ng-container [ngSwitch]="selectedIndex">
 *      <ng-container *ngSwitchCase="1">
 *        <div section-card>section-card-1-tab-1</div>
 *        <div section-card>section-card-2-tab-1</div>
 *      </ng-container>
 *    <div *ngSwitchCase="2" section-card>section-card-1-tab-2</div>
 *    </ng-container>
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
