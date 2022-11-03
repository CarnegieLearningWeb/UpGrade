import { Component } from '@angular/core';
import { ExperimentService } from '../../../../core/experiments/experiments.service';
import { PreviewUsersService } from '../../../../core/preview-users/preview-users.service';

@Component({
  selector: 'app-user-root',
  templateUrl: './experiment-users-root.component.html',
  styleUrls: ['./experiment-users-root.component.scss'],
})
export class ExperimentUsersRootComponent {
  constructor(private experimentService: ExperimentService, private previewUsersService: PreviewUsersService) {}

  selectedTabChange(event) {
    if (event.index === 1) {
      this.experimentService.fetchAllExperimentNames();
      this.previewUsersService.fetchPreviewUsers(true);
    }
  }
}
