import { Component } from '@angular/core';
import { ExperimentService } from '../../../../core/experiments/experiments.service';
import { PreviewUsersService } from '../../../../core/preview-users/preview-users.service';
import { StratificationFactorsService } from '../../../../core/stratification-factors/stratification-factors.service';

@Component({
    selector: 'app-user-root',
    templateUrl: './experiment-users-root.component.html',
    styleUrls: ['./experiment-users-root.component.scss'],
    standalone: false
})
export class ExperimentUsersRootComponent {
  constructor(
    private experimentService: ExperimentService,
    private previewUsersService: PreviewUsersService,
    private stratificationFactorsService: StratificationFactorsService
  ) {}

  ngOnInit() {
    this.selectedTabChange({ index: 0 });
  }

  selectedTabChange(event) {
    if (event.index === 0) {
      this.experimentService.fetchAllExperimentNames();
      this.previewUsersService.fetchPreviewUsers(true);
    } else if (event.index === 1) {
      this.stratificationFactorsService.fetchStratificationFactors(true);
    }
  }
}
