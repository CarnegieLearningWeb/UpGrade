import { Container } from 'typedi';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { ImportExportService } from '../../../../src/api/services/ImportExportService';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';
import {
  ASSIGNMENT_UNIT,
  CONSISTENCY_RULE,
  POST_EXPERIMENT_RULE,
  EXPERIMENT_STATE,
  EXPERIMENT_TYPE,
  FILTER_MODE,
  ASSIGNMENT_ALGORITHM,
  SEGMENT_TYPE,
} from 'upgrade_types';
import { v4 as uuid } from 'uuid';

export default async function testExperimentValidation(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const importExportService = Container.get<ImportExportService>(ImportExportService);
  const userService = Container.get<UserService>(UserService);

  // Create user for test
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // Function to create base experiment data with fresh UUIDs
  const createBaseExperimentData = () => ({
    id: uuid(),
    name: 'Validation Test Experiment',
    description: 'Test experiment for validation',
    context: ['home'],
    state: EXPERIMENT_STATE.INACTIVE,
    startOn: new Date('2021-08-11T05:41:51.655Z'),
    consistencyRule: CONSISTENCY_RULE.EXPERIMENT,
    assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
    postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
    assignmentAlgorithm: ASSIGNMENT_ALGORITHM.RANDOM,
    enrollmentCompleteCondition: {
      userCount: 0,
      groupCount: 0,
    },
    endOn: new Date('2021-08-11T05:41:51.655Z'),
    revertTo: null,
    tags: ['string'],
    group: undefined, // Must be undefined when assignmentUnit is INDIVIDUAL
    filterMode: FILTER_MODE.INCLUDE_ALL,
    type: EXPERIMENT_TYPE.SIMPLE,
    conditions: [
      {
        id: uuid(),
        name: 'Test Condition',
        conditionCode: 'testCondition',
        assignmentWeight: 100,
        description: 'Test condition description',
        order: 1,
      },
    ],
    partitions: [
      {
        site: 'testSite',
        target: 'testTarget',
        id: uuid(),
        description: 'Test partition description',
        excludeIfReached: false,
        order: 1,
      },
    ],
    experimentSegmentInclusion: {
      segment: {
        individualForSegment: [],
        groupForSegment: [],
        subSegments: [],
        type: SEGMENT_TYPE.PRIVATE,
      },
    },
    experimentSegmentExclusion: {
      segment: {
        individualForSegment: [],
        groupForSegment: [],
        subSegments: [],
        type: SEGMENT_TYPE.PRIVATE,
      },
    },
  });

  // Test 1: INDIVIDUAL assignmentUnit with group defined should fail
  console.log('Testing: INDIVIDUAL assignmentUnit with group defined should fail');
  const invalidExperiment1 = {
    ...createBaseExperimentData(),
    assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
    group: 'someGroup', // This should cause validation to fail
  };

  try {
    await experimentService.create(invalidExperiment1, user, new UpgradeLogger());
    throw new Error('Expected validation error but experiment was created successfully');
  } catch (error) {
    // This should fail validation
    expect(error).toBeDefined();
    console.log('✓ Validation correctly failed for INDIVIDUAL with group');
  }

  // Test 2: GROUP assignmentUnit with no group should fail
  console.log('Testing: GROUP assignmentUnit with no group should fail');
  const invalidExperiment2 = {
    ...createBaseExperimentData(),
    assignmentUnit: ASSIGNMENT_UNIT.GROUP,
    group: undefined, // This should cause validation to fail
  };

  try {
    await experimentService.create(invalidExperiment2, user, new UpgradeLogger());
    throw new Error('Expected validation error but experiment was created successfully');
  } catch (error) {
    // This should fail validation
    expect(error).toBeDefined();
    console.log('✓ Validation correctly failed for GROUP with no group');
  }

  // Test 3: GROUP assignmentUnit with empty group should fail
  console.log('Testing: GROUP assignmentUnit with empty group should fail');
  const invalidExperiment3 = {
    ...createBaseExperimentData(),
    assignmentUnit: ASSIGNMENT_UNIT.GROUP,
    group: '', // This should cause validation to fail
  };

  try {
    await experimentService.create(invalidExperiment3, user, new UpgradeLogger());
    throw new Error('Expected validation error but experiment was created successfully');
  } catch (error) {
    // This should fail validation
    expect(error).toBeDefined();
    console.log('✓ Validation correctly failed for GROUP with empty group');
  }

  // Test 4: GROUP assignmentUnit with valid group should succeed
  console.log('Testing: GROUP assignmentUnit with valid group should succeed');
  const validExperiment = {
    ...createBaseExperimentData(),
    assignmentUnit: ASSIGNMENT_UNIT.GROUP,
    group: 'validGroupName', // This should pass validation
  };

  try {
    const createdExperiment = await experimentService.create(validExperiment, user, new UpgradeLogger());
    expect(createdExperiment).toBeDefined();
    expect(createdExperiment.assignmentUnit).toBe(ASSIGNMENT_UNIT.GROUP);
    expect(createdExperiment.group).toBe('validGroupName');
    console.log('✓ Valid GROUP experiment created successfully');
    console.log('>> createdExperiment:', createdExperiment);

    // Clean up
    await experimentService.delete(createdExperiment.id, user, { logger: new UpgradeLogger() });
  } catch (error) {
    throw new Error(`Valid experiment should have been created: ${JSON.stringify(error)}`);
  }

  // Test 5: Import endpoint validation - INDIVIDUAL with group should fail
  console.log('Testing: Import endpoint - INDIVIDUAL with group should fail');
  const invalidImportExperiment1 = {
    ...createBaseExperimentData(),
    assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
    group: 'shouldNotBeSet', // This should cause validation to fail
  };

  try {
    await importExportService.createMultipleExperiments([invalidImportExperiment1], user, new UpgradeLogger());
    throw new Error('Expected validation error but experiments were imported successfully');
  } catch (error) {
    // This should fail validation
    expect(error).toBeDefined();
    console.log('✓ Import validation correctly failed for INDIVIDUAL with group');
  }

  // Test 6: Import endpoint validation - GROUP with no group should fail
  console.log('Testing: Import endpoint - GROUP with no group should fail');
  const invalidImportExperiment2 = {
    ...createBaseExperimentData(),
    assignmentUnit: ASSIGNMENT_UNIT.GROUP,
    group: undefined, // This should cause validation to fail
  };

  try {
    await importExportService.createMultipleExperiments([invalidImportExperiment2], user, new UpgradeLogger());
    throw new Error('Expected validation error but experiments were imported successfully');
  } catch (error) {
    // This should fail validation
    expect(error).toBeDefined();
    console.log('✓ Import validation correctly failed for GROUP with no group');
  }

  // Test 7: Import endpoint validation - Valid GROUP experiment should succeed
  console.log('Testing: Import endpoint - Valid GROUP experiment should succeed');
  const validImportExperiment = {
    ...createBaseExperimentData(),
    assignmentUnit: ASSIGNMENT_UNIT.GROUP,
    group: 'validImportGroup', // This should pass validation
  };

  try {
    const importedExperiments = await importExportService.createMultipleExperiments(
      [validImportExperiment],
      user,
      new UpgradeLogger()
    );
    expect(importedExperiments).toBeDefined();
    expect(importedExperiments.length).toBe(1);
    expect(importedExperiments[0].assignmentUnit).toBe(ASSIGNMENT_UNIT.GROUP);
    expect(importedExperiments[0].group).toBe('validImportGroup');
    console.log('✓ Valid GROUP experiment imported successfully');

    // Clean up
    await experimentService.delete(importedExperiments[0].id, user, { logger: new UpgradeLogger() });
  } catch (error) {
    throw new Error(`Valid experiment should have been imported: ${JSON.stringify(error)}`);
  }

  console.log('All experiment validation tests completed successfully!');
}
