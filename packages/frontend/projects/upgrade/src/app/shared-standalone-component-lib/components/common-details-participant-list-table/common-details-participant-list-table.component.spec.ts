import { MemberTypes, Segment } from '../../../core/segments/store/segments.model';
import { ParticipantListTableRow } from '../../../core/feature-flags/store/feature-flags.model';
import { SEGMENT_TYPE } from 'upgrade_types';
import { CommonDetailsParticipantListTableComponent } from './common-details-participant-list-table.component';

describe('CommonDetailsParticipantListTableComponent', () => {
  let component: CommonDetailsParticipantListTableComponent;

  beforeEach(() => {
    component = new CommonDetailsParticipantListTableComponent();
  });

  it('infers a legacy Segment-backed wrapper from its subsegment relationship', () => {
    const rowData = {
      listType: undefined,
      segment: {
        subSegments: [{ type: SEGMENT_TYPE.PUBLIC }],
      } as Segment,
    } as ParticipantListTableRow;

    expect(component.getFormattedListType(rowData)).toBe(MemberTypes.SEGMENT);
    expect(component.isSegmentListType(rowData)).toBe(true);
    expect(component.isDirectValueList(rowData)).toBe(false);
    expect(component.isPublicSegment(rowData)).toBe(true);
  });

  it('keeps a list without a type or subsegments classified as a direct value list', () => {
    const rowData = {
      listType: undefined,
      segment: { subSegments: [] } as Segment,
    } as ParticipantListTableRow;

    expect(component.getFormattedListType(rowData)).toBe('');
    expect(component.isSegmentListType(rowData)).toBe(false);
    expect(component.isDirectValueList(rowData)).toBe(true);
  });
});
