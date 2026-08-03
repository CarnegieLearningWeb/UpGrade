import { FormBuilder } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';

jest.mock(
  '@shared-component-lib',
  () => ({
    CommonListValuesInputComponent: class {},
    CommonModalComponent: class {},
  }),
  { virtual: true }
);
jest.mock('@shared-component-lib/common-modal/common-modal.types', () => ({}), { virtual: true });

import {
  LIST_OPTION_TYPE,
  PRIVATE_SEGMENT_LIST_FORM_FIELDS,
  UPSERT_PRIVATE_SEGMENT_LIST_ACTION,
} from '../../../core/segments/store/segments.model';
import { UpsertPrivateSegmentListModalComponent } from '../../../features/dashboard/segments/modals/upsert-private-segment-list-modal/upsert-private-segment-list-modal.component';

describe('CommonListValuesInputComponent form integration', () => {
  let component: UpsertPrivateSegmentListModalComponent;

  beforeEach(() => {
    component = new UpsertPrivateSegmentListModalComponent(
      {
        title: 'Add Include List',
        params: {
          sourceList: null,
          sourceAppContext: 'test-context',
          action: UPSERT_PRIVATE_SEGMENT_LIST_ACTION.ADD_FLAG_INCLUDE_LIST,
          id: 'test-id',
        },
      },
      {} as never,
      new FormBuilder(),
      { isLoadingSegments$: new BehaviorSubject(false) } as never,
      { isLoadingUpsertPrivateSegmentList$: new BehaviorSubject(false) } as never,
      { isLoadingUpsertPrivateSegmentList$: new BehaviorSubject(false) } as never,
      {} as never,
      { markForCheck: jest.fn() } as never,
      {} as never
    );

    component.createPrivateSegmentListForm();
    component.listenForIsInitialFormValueChanged();
    component.listenForPrimaryButtonDisabled();
  });

  afterEach(() => component.subscriptions.unsubscribe());

  it('enables Create only after every required direct-value field is valid', () => {
    let disabled: boolean;
    const subscription = component.isPrimaryButtonDisabled$.subscribe((value) => (disabled = value));

    expect(disabled).toBe(true);
    component.privateSegmentListForm
      .get(PRIVATE_SEGMENT_LIST_FORM_FIELDS.LIST_TYPE)
      .setValue(LIST_OPTION_TYPE.INDIVIDUAL);
    component.privateSegmentListForm.get(PRIVATE_SEGMENT_LIST_FORM_FIELDS.NAME).setValue('My list');
    expect(disabled).toBe(true);

    component.privateSegmentListForm.get(PRIVATE_SEGMENT_LIST_FORM_FIELDS.VALUES).setValue(['user-1']);
    expect(disabled).toBe(false);

    component.privateSegmentListForm.get(PRIVATE_SEGMENT_LIST_FORM_FIELDS.VALUES).setValue([]);
    expect(disabled).toBe(true);
    subscription.unsubscribe();
  });

  it('disables Create while a value addition, import, or edit is pending', () => {
    let disabled: boolean;
    const subscription = component.isPrimaryButtonDisabled$.subscribe((value) => (disabled = value));
    component.privateSegmentListForm
      .get(PRIVATE_SEGMENT_LIST_FORM_FIELDS.LIST_TYPE)
      .setValue(LIST_OPTION_TYPE.INDIVIDUAL);
    component.privateSegmentListForm.get(PRIVATE_SEGMENT_LIST_FORM_FIELDS.NAME).setValue('My list');
    component.privateSegmentListForm.get(PRIVATE_SEGMENT_LIST_FORM_FIELDS.VALUES).setValue(['user-1']);
    expect(disabled).toBe(false);

    component.onValuesPendingStateChanged(true);
    expect(disabled).toBe(true);

    component.onValuesPendingStateChanged(false);
    expect(disabled).toBe(false);
    subscription.unsubscribe();
  });
});
