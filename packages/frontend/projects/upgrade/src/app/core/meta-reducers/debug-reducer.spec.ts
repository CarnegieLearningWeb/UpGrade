import { createAction, createReducer, props } from '@ngrx/store';
import { debug } from './debug.reducer';

describe('debug', () => {
  it('should load console.log without affecting state', () => {
    const previousState = {
      msg: 'hello!',
      router: null,
    };
    const reducer = createReducer(previousState);
    const testAction = createAction(
      '[Test] msg action called',
      props<{
        msg: string;
      }>()
    );

    const msgAction = testAction({ msg: 'goodbye!' });
    const metaReducer = debug(reducer);
    const newState = metaReducer(previousState, msgAction);

    expect(newState).toEqual(previousState);
  });
});
