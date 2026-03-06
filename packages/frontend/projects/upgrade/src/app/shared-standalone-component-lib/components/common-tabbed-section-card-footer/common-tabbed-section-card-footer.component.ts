import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';

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
export class CommonTabbedSectionCardFooterComponent implements OnInit {
  @Input() selectedIndex = 0; // Default to the first tab
  @Input() tabLabels: { label: string; disabled?: boolean }[] = [];
  @Output() selectedTabChange = new EventEmitter<number>();

  router = inject(Router);
  route = inject(ActivatedRoute);
  changeDetector = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.setSelectedTabFromQueryParams();
  }

  onSelectedTabChange(event: MatTabChangeEvent) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: event.index },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    this.selectedTabChange.emit(event.index);
  }

  setSelectedTabFromQueryParams() {
    const tab = this.route.snapshot.queryParamMap.get('tab');

    if (tab) {
      const selectedTab = parseInt(tab, 10);

      if (isNaN(selectedTab)) {
        console.warn('Tab index from url is not a number');
        return;
      }

      const tabWithinRange = selectedTab >= 0 && selectedTab < this.tabLabels.length;

      if (!tabWithinRange) {
        console.warn('Tab index from url is out of range');
        return;
      }

      this.selectedIndex = selectedTab;
    }

    this.selectedTabChange.emit(this.selectedIndex);
    this.changeDetector.markForCheck();
  }
}
