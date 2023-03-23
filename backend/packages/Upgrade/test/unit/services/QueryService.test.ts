import { QueryService } from '../../../src/api/services/QueryService';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { QueryRepository } from '../../../src/api/repositories/QueryRepository';
import { LogRepository } from '../../../src/api/repositories/LogRepository';
import { Query } from '../../../src/api/models/Query';
import { Experiment } from '../../../src/api/models/Experiment';
import { ErrorService } from '../../../src/api/services/ErrorService';
import { ErrorRepository } from '../../../src/api/repositories/ErrorRepository';

const logger = new UpgradeLogger();

describe('Query Service Testing', () => {
  let service: QueryService;
  let queryRepo: Repository<QueryRepository>;
  let module: TestingModule;

  const exp1 = new Experiment();
  exp1.id = 'exp1';
  exp1.name = 'experiment1';
  exp1.conditions = [];

  const mockquery1 = new Query();
  mockquery1.id = 'id1';
  mockquery1.name = 'query1';
  mockquery1.experiment = exp1;

  const exp2 = new Experiment();
  exp2.id = 'exp2';
  exp2.name = 'experiment2';

  const mockquery2 = new Query();
  mockquery2.id = 'id2';
  mockquery2.name = 'query2';
  mockquery2.experiment = exp2;

  const queryArr = [mockquery1, mockquery2];

  const logResult = {
    conditionId: 'cond1',
    result: 0,
    participantsLogged: 0,
  };
  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        QueryService,
        QueryRepository,
        LogRepository,
        ErrorService,
        ErrorRepository,
        {
          provide: getRepositoryToken(QueryRepository),
          useValue: {
            find: jest.fn().mockResolvedValue(queryArr),
            findOne: jest.fn().mockResolvedValue(mockquery1),
          },
        },
        {
          provide: getRepositoryToken(LogRepository),
          useValue: {
            find: jest.fn().mockResolvedValue(queryArr),
            analysis: jest.fn().mockImplementation((query) => {
              console.log(query);
              if (query.id) return logResult;
              else return Promise.reject(new Error());
            }),
          },
        },
        {
          provide: ErrorService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<QueryService>(QueryService);
    queryRepo = module.get<Repository<QueryRepository>>(getRepositoryToken(QueryRepository));
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  it('should have the repo mocked', async () => {
    expect(await queryRepo.find()).toEqual(queryArr);
  });

  it('should find and map queries to experiments', async () => {
    const response = await service.find(logger);
    expect(response).toEqual([
      {
        experiment: {
          id: exp1.id,
          name: exp1.name,
        },
        id: mockquery1.id,
        name: mockquery1.name,
      },
      {
        experiment: {
          id: exp2.id,
          name: exp2.name,
        },
        id: mockquery2.id,
        name: mockquery2.name,
      },
    ]);
  });

  it('should find and map results to queries', async () => {
    const response = await service.analyze(['id1'], logger);
    expect(response).toEqual([
      {
        id: mockquery1.id,
        interactionEffect: null,
        mainEffect: logResult,
      },
    ]);
  });

  it('should log error when query fails', async () => {
    queryRepo.findOne = jest.fn().mockResolvedValue([]);
    const response = await service.analyze(['id1'], logger);
    expect(response).toEqual([
      {
        id: mockquery1.id,
        interactionEffect: null,
        mainEffect: ['rejected'],
      },
    ]);
  });
});
