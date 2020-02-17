import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserRoutingModule } from './experiment-users-routing.module';
import { SharedModule } from '../../../shared/shared.module';
import { ExperimentUsersRootComponent } from './experiment-users-root/experiment-users-root.component';

@NgModule({
  declarations: [ExperimentUsersRootComponent],
  imports: [CommonModule, SharedModule, UserRoutingModule]
})
export class ExperimentUsersModule {}
