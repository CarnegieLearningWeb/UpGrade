import { createAction, props } from '@ngrx/store';

import { ThemeOptions, SettingParams } from './settings.model';

export const actionChangeTheme = createAction('[Settings] Change Theme', props<{ theme: ThemeOptions }>());

export const actionGetSetting = createAction('[Settings] Get Setting');

export const actionGetSettingSuccess = createAction(
  '[Settings] Get Setting Success',
  props<{ setting: SettingParams }>()
);

export const actionGetSettingFailure = createAction('[Settings] Get Setting Failure');

export const actionSetSetting = createAction('[Settings] Set Setting', props<{ setting: SettingParams }>());

export const actionSetSettingSuccess = createAction('[Settings] Set Setting Success', props<{ setting: boolean }>());

export const actionSetSettingFailure = createAction('[Settings] Set Setting Failure');
