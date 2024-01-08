import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserRoutingModule } from './experiment-users-routing.module';
import { SharedModule } from '../../../shared/shared.module';
import { ExperimentUsersRootComponent } from './experiment-users-root/experiment-users-root.component';
import { PreviewUserComponent } from './components/preview-user/preview-user.component';
import { StratificationComponent } from './components/stratification-factor-list/stratification-factor-list.component';
import { ImportStratificationsComponent } from './components/stratification-factor-list/import-stratifications/import-stratifications.component';
import { DeleteStratificationComponent } from './components/stratification-factor-list/delete-stratification/delete-stratification.component';

@NgModule({
  declarations: [
    ExperimentUsersRootComponent,
    PreviewUserComponent,
    StratificationComponent,
    ImportStratificationsComponent,
    DeleteStratificationComponent,
  ],
  imports: [CommonModule, SharedModule, UserRoutingModule],
})
export class ExperimentUsersModule {}
