import { Container } from 'typedi';
import { Connection } from 'typeorm';

import { Experiment, EXPERIMENT_STATE, CONSISTENCY_RULE, ASSIGNMENT_UNIT, POST_EXPERIMENT_RULE } from '../../src/api/models/Experiment';
import { ExperimentService } from '../../src/api/services/ExperimentService';
import { closeDatabase, createDatabaseConnection, migrateDatabase } from '../utils/database';
import { configureLogger } from '../utils/logger';

describe('ExperimentService', () => {

    // -------------------------------------------------------------------------
    // Setup up
    // -------------------------------------------------------------------------

    let connection: Connection;
    beforeAll(async () => {
        configureLogger();
        connection = await createDatabaseConnection();
    });
    beforeEach(() => migrateDatabase(connection));

    // -------------------------------------------------------------------------
    // Tear down
    // -------------------------------------------------------------------------

    afterAll(() => closeDatabase(connection));

    // -------------------------------------------------------------------------
    // Test cases
    // -------------------------------------------------------------------------

    test('should create a new experiment in the database', async (done) => {
        const experiment = new Experiment();
        experiment.id = 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx';
        experiment.name = 'test-experiment';
        experiment.state = EXPERIMENT_STATE.INACTIVE;
        experiment.consistencyRule = CONSISTENCY_RULE.EXPERIMENT;
        experiment.assignmentUnit = ASSIGNMENT_UNIT.GROUP;
        experiment.postExperimentRule = POST_EXPERIMENT_RULE.REVERT_TO_DEFAULT;

        const service = Container.get<ExperimentService>(ExperimentService);
        const resultCreate = await service.create(experiment);
        expect(resultCreate.name).toBe(experiment.name);
        expect(resultCreate.state).toBe(experiment.state);

        const resultFind = await service.findOne(resultCreate.id);
        if (resultFind) {
            expect(resultFind.name).toBe(experiment.name);
            expect(resultFind.state).toBe(experiment.state);
        } else {
            fail('Could not find experiment');
        }
        done();
    });

});
