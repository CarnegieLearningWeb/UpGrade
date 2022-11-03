import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EffectsModule } from '@ngrx/effects';
import { PreviewUsersEffects } from './store/preview-users.effects';
import { previewUsersReducer } from './store/preview-users.reducer';
import { StoreModule } from '@ngrx/store';
import { PreviewUsersDataService } from './preview-users.data.service';
import { PreviewUsersService } from './preview-users.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    EffectsModule.forFeature([PreviewUsersEffects]),
    StoreModule.forFeature('previewUsers', previewUsersReducer),
  ],
  providers: [PreviewUsersService, PreviewUsersDataService],
})
export class PreviewUsersModule {}
