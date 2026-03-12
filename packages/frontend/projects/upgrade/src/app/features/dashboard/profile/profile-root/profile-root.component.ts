import { ChangeDetectorRef, Component, inject, Input, OnInit } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { CommonTabHelpersService } from '../../../../shared/services/common-tab-helpers.service';

@Component({
  selector: 'app-profile-root',
  templateUrl: './profile-root.component.html',
  styleUrls: ['./profile-root.component.scss'],
  standalone: false,
})
export class ProfileRootComponent implements OnInit {
  @Input() selectedIndex = 0;
  tabLabels: { label: string; disabled?: boolean }[] = [
    { label: 'profile.heading.text' },
    { label: 'global.metrics.text' },
  ];

  route = inject(ActivatedRoute);
  changeDetector = inject(ChangeDetectorRef);
  tabHelpers = inject(CommonTabHelpersService);

  ngOnInit(): void {
    const tabIndex = this.tabHelpers.getTabIndexFromQueryParams(this.route, this.tabLabels.length);
    if (tabIndex !== null) {
      this.selectedIndex = tabIndex;
    }
    this.changeDetector.markForCheck();
  }

  onSelectedTabChange(event: MatTabChangeEvent) {
    this.tabHelpers.navigateToTab(event.index, this.route);
  }
}
