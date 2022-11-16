import { globalExcludeSegment } from '../../../src/init/seed/globalExcludeSegment';
import Container from 'typedi';
import { SegmentService } from '../../../src/api/services/SegmentService';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { segment } from '../mockData/segment';

export default async function SegmentUpdate(): Promise<void> {
  const segmentService = Container.get<SegmentService>(SegmentService);

  // create segment

  const segmentObject = segment;

  await segmentService.upsertSegment(segmentObject, new UpgradeLogger());
  let segments = await segmentService.getAllSegments(new UpgradeLogger());

  expect(segments.length).toEqual(2);
  expect(segments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: globalExcludeSegment.name,
        description: globalExcludeSegment.description,
        context: globalExcludeSegment.context,
        type: globalExcludeSegment.type,
        individualForSegment: expect.arrayContaining([]),
        groupForSegment: expect.arrayContaining([]),
        subSegments: expect.arrayContaining([]),
      }),
      expect.objectContaining({
        name: segmentObject.name,
        description: segmentObject.description,
        context: segmentObject.context,
        type: segmentObject.type,
        individualForSegment: expect.arrayContaining([
          expect.objectContaining({
            userId: segmentObject.userIds[0],
          }),
          expect.objectContaining({
            userId: segmentObject.userIds[1],
          }),
        ]),
        groupForSegment: expect.arrayContaining([
          expect.objectContaining({
            groupId: segmentObject.groups[0].groupId,
            type: segmentObject.groups[0].type,
          }),
          expect.objectContaining({
            groupId: segmentObject.groups[1].groupId,
            type: segmentObject.groups[1].type,
          }),
        ]),
      }),
    ])
  );

  // update segment

  const updatedSegmentObject = {
    ...segmentObject,
    name: 'updated segment2',
    description: 'updated description2',
    context: 'updated context2',
    userIds: ['user3', 'user4'],
    groups: [
      { groupId: 'id3', type: 'type3' },
      { groupId: 'id3', type: 'type3' },
    ],
  };

  await segmentService.upsertSegment(updatedSegmentObject, new UpgradeLogger());
  segments = await segmentService.getAllSegments(new UpgradeLogger());

  expect(segments.length).toEqual(2);
  expect(segments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: globalExcludeSegment.name,
        description: globalExcludeSegment.description,
        context: globalExcludeSegment.context,
        type: globalExcludeSegment.type,
        individualForSegment: expect.arrayContaining([]),
        groupForSegment: expect.arrayContaining([]),
        subSegments: expect.arrayContaining([]),
      }),
      expect.objectContaining({
        id: segmentObject.id,
        name: updatedSegmentObject.name,
        description: updatedSegmentObject.description,
        context: updatedSegmentObject.context,
        type: updatedSegmentObject.type,
        individualForSegment: expect.arrayContaining([
          expect.objectContaining({
            userId: updatedSegmentObject.userIds[0],
          }),
          expect.objectContaining({
            userId: updatedSegmentObject.userIds[1],
          }),
        ]),
        groupForSegment: expect.arrayContaining([
          expect.objectContaining({
            groupId: updatedSegmentObject.groups[0].groupId,
            type: updatedSegmentObject.groups[0].type,
          }),
          expect.objectContaining({
            groupId: updatedSegmentObject.groups[1].groupId,
            type: updatedSegmentObject.groups[1].type,
          }),
        ]),
        subSegments: [],
      }),
    ])
  );
}
