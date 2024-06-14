import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { FeatureFlag } from '../../../../../../../core/feature-flags/store/feature-flags.model';
import { IMenuButtonItem } from 'upgrade_types';


@Component({
  selector: 'app-feature-flag-exclusions-section-card',
  standalone: true,
  imports: [
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    CommonModule,
    TranslateModule,
  ],
  templateUrl: './feature-flag-exclusions-section-card.component.html',
  styleUrl: './feature-flag-exclusions-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagExclusionsSectionCardComponent {
  @Input() data: FeatureFlag;
  tableRowCount$ = of(1);
  menuButtonItems: IMenuButtonItem[] = [
    { name: 'Edit', disabled: false },
    { name: 'Delete', disabled: false },
  ];
  isSectionCardExpanded = true;

  addExcludeListClicked() {
    console.log('add Exclude List Clicked');
  }

  onMenuButtonItemClick(event) {
    console.log('Menu button Clicked');
    console.log(event);
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean) {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }
}
