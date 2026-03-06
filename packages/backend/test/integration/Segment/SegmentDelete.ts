import Container from 'typedi';
import { SegmentService } from '../../../src/api/services/SegmentService';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { segment, segmentSecond, segmentList, segmentWithList } from '../mockData/segment';
import { env } from '../../../src/env';

export default async function SegmentDelete(): Promise<void> {
  const segmentService = Container.get<SegmentService>(SegmentService);

  const globalSegmentLength = Object.keys(env.initialization.contextMetadata).length;

  // create segment
  const segmentObject = segment;

  await segmentService.upsertSegment(segmentObject, new UpgradeLogger());
  let segments = await segmentService.getAllSegments(new UpgradeLogger());

  expect(segments.length).toEqual(1 + globalSegmentLength);
  expect(segments).toEqual(
    expect.arrayContaining([
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

  // create segment2
  // making segment1 as child/subSegment of segment2

  const segmentObject2 = segmentSecond;

  await segmentService.upsertSegment(segmentObject2, new UpgradeLogger());
  segments = await segmentService.getAllSegments(new UpgradeLogger());
  expect(segments.length).toEqual(2 + globalSegmentLength);
  expect(segments).toEqual(
    expect.arrayContaining([
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
      expect.objectContaining({
        name: segmentObject2.name,
        description: segmentObject2.description,
        context: segmentObject2.context,
        type: segmentObject2.type,
        individualForSegment: expect.arrayContaining([
          expect.objectContaining({
            userId: segmentObject2.userIds[0],
          }),
          expect.objectContaining({
            userId: segmentObject2.userIds[1],
          }),
        ]),
        groupForSegment: expect.arrayContaining([
          expect.objectContaining({
            groupId: segmentObject2.groups[0].groupId,
            type: segmentObject2.groups[0].type,
          }),
          expect.objectContaining({
            groupId: segmentObject2.groups[1].groupId,
            type: segmentObject2.groups[1].type,
          }),
        ]),
        subSegments: expect.arrayContaining([
          expect.objectContaining({
            id: segmentObject.id,
          }),
        ]),
      }),
    ])
  );

  // delete segment
  // delete child segment of segment2. SubSegment should be emptied as well.

  await segmentService.deleteSegment(segmentObject.id, new UpgradeLogger());

  segments = await segmentService.getAllSegments(new UpgradeLogger());

  expect(segments.length).toEqual(1 + globalSegmentLength);
  expect(segments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: segmentObject2.name,
        description: segmentObject2.description,
        context: segmentObject2.context,
        type: segmentObject2.type,
        individualForSegment: expect.arrayContaining([
          expect.objectContaining({
            userId: segmentObject2.userIds[0],
          }),
          expect.objectContaining({
            userId: segmentObject2.userIds[1],
          }),
        ]),
        groupForSegment: expect.arrayContaining([
          expect.objectContaining({
            groupId: segmentObject2.groups[0].groupId,
            type: segmentObject2.groups[0].type,
          }),
          expect.objectContaining({
            groupId: segmentObject2.groups[1].groupId,
            type: segmentObject2.groups[1].type,
          }),
        ]),
        subSegments: [],
      }),
    ])
  );

  // Create segment with List (private segment)
  const segmentWithListObject = segmentWithList;

  await segmentService.upsertSegment(segmentWithListObject, new UpgradeLogger());
  const privateSegmentObject = segmentList;
  // adds a private segment
  await segmentService.addList(privateSegmentObject, new UpgradeLogger());
  segments = await segmentService.getAllSegments(new UpgradeLogger());
  expect(segments.length).toEqual(2 + globalSegmentLength);
  await segmentService.deleteSegment(segmentWithListObject.id, new UpgradeLogger());
  segments = await segmentService.getAllSegments(new UpgradeLogger());
  expect(segments.length).toEqual(1 + globalSegmentLength);
}
