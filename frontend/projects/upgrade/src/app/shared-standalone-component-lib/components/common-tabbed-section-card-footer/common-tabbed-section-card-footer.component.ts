import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';

/**
 * The `app-common-tabbed-section-card-footer` component provides a common footer component for tabbed sections.
 * It allows the user to switch between different tabs and emits the selected tab index when changed.
 *
 * Example usage:
 *
 * ```html
 * <app-common-tabbed-section-card-footer
 *   [tabLabels]="[{label: 'Tab 1'}, {label: 'Tab 2', disabled: true}]"
 *   (selectedTabChange)="onSelectedTabChange($event)">
 * </app-common-tabbed-section-card-footer>
 * ```
 */
@Component({
  selector: 'app-common-tabbed-section-card-footer',
  imports: [MatTabsModule, CommonModule],
  templateUrl: './common-tabbed-section-card-footer.component.html',
  styleUrl: './common-tabbed-section-card-footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonTabbedSectionCardFooterComponent {
  @Input() tabLabels: { label: string; disabled?: boolean }[] = [];
  @Output() selectedTabChange = new EventEmitter<number>();

  onSelectedTabChange(event: MatTabChangeEvent) {
    this.selectedTabChange.emit(event.index);
  }
}
