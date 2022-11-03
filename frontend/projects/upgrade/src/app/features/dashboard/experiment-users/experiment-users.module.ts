import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserRoutingModule } from './experiment-users-routing.module';
import { SharedModule } from '../../../shared/shared.module';
import { ExperimentUsersRootComponent } from './experiment-users-root/experiment-users-root.component';
import { PreviewUserComponent } from './components/preview-user/preview-user.component';
import { ExperimentUsersComponent } from './components/experiment-users/experiment-users.component';

@NgModule({
  declarations: [ExperimentUsersRootComponent, PreviewUserComponent, ExperimentUsersComponent],
  imports: [CommonModule, SharedModule, UserRoutingModule],
})
export class ExperimentUsersModule {}
