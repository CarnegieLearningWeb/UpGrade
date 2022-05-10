import { HttpClient } from "@angular/common/http";
import { of } from "rxjs/internal/observable/of";
import { environment } from "../../../environments/environment";
import { ExperimentDataService } from "./experiments.data.service";
import { ASSIGNMENT_UNIT, CONSISTENCY_RULE, Experiment, ExperimentPaginationParams, ExperimentStateInfo, EXPERIMENT_STATE, POST_EXPERIMENT_RULE } from "./store/experiments.model";

class MockHTTPClient {
    get = jest.fn().mockReturnValue(of());
    post = jest.fn().mockReturnValue(of());
    delete = jest.fn().mockReturnValue(of());
    put = jest.fn().mockReturnValue(of());
}

describe('ExperimentDataService', () => {
    let mockHttpClient: any; 
    let service: ExperimentDataService;
    let mockExperiment: Experiment;
    let mockExperimentId: string;
    let mockExperimentIds: string[];
    let mockParams: ExperimentPaginationParams;
    let mockEmail: string;

    beforeEach(() => {
        mockHttpClient = new MockHTTPClient();
        service = new ExperimentDataService(mockHttpClient as HttpClient);
        mockEmail = 'test@testmail.com'
        mockParams = {
            skip: 0,
            take: 10
        };
        mockExperimentId = 'abc123';
        mockExperimentIds = [
            'abc123',
            'qwerty99'
        ]
        mockExperiment = {
            id: 'abc123',
            name: 'abc123',
            description: 'abc123',
            createdAt: 'time',
            updatedAt: 'time',
            state: EXPERIMENT_STATE.INACTIVE,
            context: [],
            startOn: 'test',
            consistencyRule: CONSISTENCY_RULE.EXPERIMENT,
            assignmentUnit: ASSIGNMENT_UNIT.GROUP,
            postExperimentRule: POST_EXPERIMENT_RULE.ASSIGN,
            enrollmentCompleteCondition: {
                userCount: 1,
                groupCount: 2,
            },
            endOn: 'test',
            revertTo: 'test',
            tags: [],
            group: 'test',
            logging: true,
            conditions: [],
            partitions: [],
            queries: [],
            stateTimeLogs: []
        }
    });

    describe('#getAllExperiment', () => {
        it('should get the getAllExperiment http observable', () => {
            const expectedUrl = environment.api.getAllExperiments;
            const params = { ...mockParams };

            service.getAllExperiment(params);

            expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, params);
        })
    })

    describe('#getAllExperimentsStats', () => {
        it('should get the getAllExperimentsStats http observable', () => {
            const expectedUrl = environment.api.experimentsStats;
            const experimentIds = [ ...mockExperimentIds];

            service.getAllExperimentsStats(experimentIds);

            expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, { experimentIds });
        })
    })

    describe('#getExperimentDetailStat', () => {
        it('should get the getExperimentDetailStat http observable', () => {
            const expectedUrl = environment.api.experimentDetailStat;
            const experimentId = mockExperimentId;

            service.getExperimentDetailStat(experimentId);

            expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, { experimentId });
        })
    })

    describe('#createNewExperiment', () => {
        it('should get the createNewExperiment http observable', () => {
            const expectedUrl = environment.api.createNewExperiments;
            const experiment = { ...mockExperiment };

            service.createNewExperiment(experiment);

            expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, { ...experiment });
        })
    })

    describe('#importExperiment', () => {
        it('should get the importExperiment http observable', () => {
            const mockUrl = environment.api.importExperiment;
            const experiment = { ...mockExperiment };

            service.importExperiment(experiment);

            expect(mockHttpClient.post).toHaveBeenCalledWith(mockUrl, { ...experiment });
        })
    })

    describe('#updateExperiment', () => {
        it('should get the deleteExcludedGroup http observable', () => {
            const experiment = { ...mockExperiment };
            const expectedUrl = `${environment.api.updateExperiments}/${experiment.id}`;

            service.updateExperiment(experiment);

            expect(mockHttpClient.put).toHaveBeenCalledWith(expectedUrl, { ...experiment });
        })
    })

    describe('#updateExperimentState', () => {
        it('should get the getAllExperiment http observable', () => {
            const expectedUrl = environment.api.updateExperimentState;
            const experimentId = mockExperimentId;
            const experimentStateInfo: ExperimentStateInfo = {
                newStatus: EXPERIMENT_STATE.INACTIVE,
                scheduleDate: 'test'
            }

            service.updateExperimentState(experimentId, experimentStateInfo);

            expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, {
                experimentId,
                state: experimentStateInfo.newStatus,
                scheduleDate: experimentStateInfo.scheduleDate
              });
        })
    })

    describe('#deleteExperiment', () => {
        it('should get the deleteExperiment http observable', () => {
            const experimentId = mockExperimentId;
            const expectedUrl = `${environment.api.updateExperiments}/${experimentId}`;

            service.deleteExperiment(experimentId);

            expect(mockHttpClient.delete).toHaveBeenCalledWith(expectedUrl);
        })
    })

    describe('#getExperimentById', () => {
        it('should get the getExperimentById http observable', () => {
            const experimentId = mockExperimentId;
            const expectedUrl = `${environment.api.getExperimentById}/${experimentId}`;

            service.getExperimentById(experimentId);

            expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl);
        })
    })

    describe('#fetchAllPartitions', () => {
        it('should get the fetchAllPartitions http observable', () => {
            const expectedUrl = environment.api.allPartitions;

            service.fetchAllPartitions();

            expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl);
        })
    })

    describe('#fetchAllExperimentNames', () => {
        it('should get the fetchAllExperimentNames http observable', () => {
            const expectedUrl = environment.api.allExperimentNames;

            service.fetchAllExperimentNames();

            expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl);
        })
    })

    describe('#exportExperimentInfo', () => {
        it('should get the exportExperimentInfo http observable', () => {
            const experimentId = mockExperimentId;
            const email = mockEmail;
            const expectedUrl = environment.api.generateCsv;

            service.exportExperimentInfo(experimentId, email);

            expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, { experimentId, email });
        })
    })

    describe('#exportExperimentDesign', () => {
        it('should get the exportExperimentDesign http observable', () => {
            const experimentId = mockExperimentId;
            const expectedUrl = `${environment.api.exportExperiment}/${experimentId}`;

            service.exportExperimentDesign(experimentId);

            expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl);
        })
    })

    describe('#fetchExperimentGraphInfo', () => {
        it('should get the fetchExperimentGraphInfo http observable', () => {
            const params = { ...mockParams };
            const expectedUrl = environment.api.experimentGraphInfo;

            service.fetchExperimentGraphInfo(params);

            expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, params);
        })
    })

    describe('#fetchContextMetaData', () => {
        it('should get the fetchContextMetaData http observable', () => {
            const expectedUrl = environment.api.contextMetaData;

            service.fetchContextMetaData();

            expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl);
        })
    })
})