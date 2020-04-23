import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProfileRoutingModule } from './profile-routing.module';
import { SharedModule } from '../../../shared/shared.module';
import { ProfileRootComponent } from './profile-root/profile-root.component';
import { NewUserComponent } from './components/modals/new-user/new-user.component';

@NgModule({
  declarations: [ProfileRootComponent, NewUserComponent],
  imports: [CommonModule, ProfileRoutingModule, SharedModule],
  entryComponents: [NewUserComponent]
})
export class ProfileModule {}
