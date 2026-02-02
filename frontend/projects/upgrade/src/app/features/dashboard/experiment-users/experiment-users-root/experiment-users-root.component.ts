import { Component } from '@angular/core';
import { ExperimentService } from '../../../../core/experiments/experiments.service';
import { PreviewUsersService } from '../../../../core/preview-users/preview-users.service';
import { StratificationFactorsService } from '../../../../core/stratification-factors/stratification-factors.service';
import { filter, take } from 'rxjs/operators';

@Component({
  selector: 'app-user-root',
  templateUrl: './experiment-users-root.component.html',
  styleUrls: ['./experiment-users-root.component.scss'],
  standalone: false,
})
export class ExperimentUsersRootComponent {
  constructor(
    private experimentService: ExperimentService,
    private previewUsersService: PreviewUsersService,
    private stratificationFactorsService: StratificationFactorsService
  ) {}

  ngOnInit() {
    // Temporarily index 1 while Preview Users tab is disabled
    // Change back to index 0 when re-enabling Preview Users tab
    this.selectedTabChange({ index: 1 });
  }

  selectedTabChange(event) {
    if (event.index === 0) {
      this.experimentService.fetchAllExperimentNames();
      this.previewUsersService.fetchPreviewUsers(true);
    } else if (event.index === 1) {
      this.experimentService.fetchAllExperimentNames();
      this.experimentService.allExperimentNames$
        .pipe(
          filter((names) => names?.length > 0),
          take(1)
        )
        .subscribe(() => {
          this.stratificationFactorsService.fetchStratificationFactors(true);
        });
    }
  }
}
