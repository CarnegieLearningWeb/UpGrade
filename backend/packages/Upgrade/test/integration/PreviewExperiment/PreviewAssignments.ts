import Container from 'typedi';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { UserService } from '../../../src/api/services/UserService';
import { systemUser } from '../mockData/user/index';
import { PreviewUserService } from '../../../src/api/services/PreviewUserService';
import { previewUsers } from '../mockData/previewUsers/index';
import { previewIndividualAssignmentExperiment } from '../mockData/experiment/index';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';

export default async function testCase(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const userService = Container.get<UserService>(UserService);
  const previewService = Container.get<PreviewUserService>(PreviewUserService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // experiment object
  const experimentObject = previewIndividualAssignmentExperiment;

  // create experiment
  await experimentService.create(experimentObject as any, user, new UpgradeLogger());
  const experiments = await experimentService.find(new UpgradeLogger());
  expect(experiments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: experimentObject.name,
        state: experimentObject.state,
        postExperimentRule: experimentObject.postExperimentRule,
        assignmentUnit: experimentObject.assignmentUnit,
        consistencyRule: experimentObject.consistencyRule,
      }),
    ])
  );

  // creating preview user
  const previewUser = await previewService.create(previewUsers[0], new UpgradeLogger());

  // add single assignments for
  let previewDocuments: any = {
    id: previewUser.id,
    assignments: [
      {
        experiment: {
          id: experiments[0].id,
        },
        experimentCondition: {
          id: experiments[0].conditions[0].id,
        },
      },
    ],
  };

  await previewService.upsertExperimentConditionAssignment(previewDocuments, new UpgradeLogger());

  let previewUsersData = await previewService.find(new UpgradeLogger());
  expect(previewUsersData[0].assignments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        experiment: expect.objectContaining({
          id: experiments[0].id,
        }),
        experimentCondition: expect.objectContaining({
          id: experiments[0].conditions[0].id,
        }),
      }),
    ])
  );

  // add new document for assignment
  previewDocuments = {
    ...previewUsersData[0],
    assignments: [
      ...previewUsersData[0].assignments,
      {
        experiment: {
          id: experiments[0].id,
        },
        experimentCondition: {
          id: experiments[0].conditions[1].id,
        },
      },
    ],
  };

  await previewService.upsertExperimentConditionAssignment(previewDocuments, new UpgradeLogger());

  previewUsersData = await previewService.find(new UpgradeLogger());
  expect(previewUsersData[0].assignments.length).toEqual(2);
  expect(previewUsersData[0].assignments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        experiment: expect.objectContaining({
          id: experiments[0].id,
        }),
        experimentCondition: expect.objectContaining({
          id: experiments[0].conditions[0].id,
        }),
      }),
      expect.objectContaining({
        experiment: expect.objectContaining({
          id: experiments[0].id,
        }),
        experimentCondition: expect.objectContaining({
          id: experiments[0].conditions[1].id,
        }),
      }),
    ])
  );

  // delete a document for assignments
  previewDocuments = {
    ...previewUsersData[0],
    assignments: [{ ...previewUsersData[0].assignments[0] }],
  };

  await previewService.upsertExperimentConditionAssignment(previewDocuments, new UpgradeLogger());

  previewUsersData = await previewService.find(new UpgradeLogger());
  expect(previewUsersData[0].assignments.length).toEqual(1);
  expect(previewUsersData[0].assignments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        experiment: expect.objectContaining({
          id: previewDocuments.assignments[0].experiment.id,
        }),
        experimentCondition: expect.objectContaining({
          id: previewDocuments.assignments[0].experimentCondition.id,
        }),
      }),
    ])
  );
}
