import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { CommonSectionCardHeaderComponent } from '../../../../../../../../shared-standalone-component-lib/components';

@Component({
  selector: 'app-feature-flag-root-table-section-card-header-container',
  standalone: true,
  templateUrl: './feature-flag-root-table-section-card-header-container.component.html',
  styleUrl: './feature-flag-root-table-section-card-header-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, CommonSectionCardHeaderComponent],
})
export class FeatureFlagRootTableSectionCardHeaderContainerComponent {
  openAddFlagModal() {
    // call common dialog service to pop common dialog
    // this.commonDialogService.openAddFlagModal();
    console.log('openAddFlagModal');
  }
}
