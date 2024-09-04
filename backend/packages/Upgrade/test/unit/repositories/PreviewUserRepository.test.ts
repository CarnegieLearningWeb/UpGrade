import { DataSource } from 'typeorm';
import { PreviewUserRepository } from '../../../src/api/repositories/PreviewUserRepository';
import { PreviewUser } from '../../../src/api/models/PreviewUser';
import { Container } from '../../../src/typeorm-typedi-extensions';
import { initializeMocks } from '../mockdata/mockRepo';

let mock;
let dataSource: DataSource;
let repo: PreviewUserRepository;
const err = new Error('test error');

const user = new PreviewUser();
user.id = 'id1';

const result = {
  identifiers: [{ id: user.id }],
  generatedMaps: [user],
  raw: [user],
};

beforeAll(() => {
  dataSource = new DataSource({
    type: 'postgres',
    database: 'postgres',
    entities: [PreviewUserRepository],
    synchronize: true,
  });
  Container.setDataSource('default', dataSource);
});

beforeEach(() => {
  repo = Container.getCustomRepository(PreviewUserRepository);
  const commonMockData = initializeMocks(result);
  repo.createQueryBuilder = commonMockData.createQueryBuilder;
  mock = commonMockData.mocks;
});

afterEach(() => {
  jest.clearAllMocks();
});
describe('PreviewUserRepository Testing', () => {
  it('should insert a new preview user', async () => {
    const res = await repo.saveRawJson(user);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith(user);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([user]);
  });

  it('should throw an error when insert fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.saveRawJson(user);
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith(user);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should delete a preview user', async () => {
    const res = await repo.deleteById(user.id);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([user]);
  });

  it('should throw an error when delete fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.deleteById(user.id);
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should find user by id', async () => {
    const res = await repo.findOneById(user.id);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.innerJoinAndSelect).toHaveBeenCalledTimes(1);
    expect(mock.innerJoin).toHaveBeenCalledTimes(2);
    expect(mock.addSelect).toHaveBeenCalledTimes(2);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.getOne).toHaveBeenCalledTimes(1);

    expect(res).toEqual(result.raw[0]);
  });

  it('should throw an error when find user by id fails', async () => {
    mock.getOne.mockRejectedValue(err);

    expect(async () => {
      await repo.findOneById(user.id);
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.innerJoinAndSelect).toHaveBeenCalledTimes(1);
    expect(mock.innerJoin).toHaveBeenCalledTimes(2);
    expect(mock.addSelect).toHaveBeenCalledTimes(2);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.getOne).toHaveBeenCalledTimes(1);
  });

  it('should find with names', async () => {
    const res = await repo.findWithNames();

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.innerJoinAndSelect).toHaveBeenCalledTimes(1);
    expect(mock.innerJoin).toHaveBeenCalledTimes(2);
    expect(mock.addSelect).toHaveBeenCalledTimes(2);
    expect(mock.getMany).toHaveBeenCalledTimes(1);

    expect(res).toEqual(result);
  });

  it('should throw an error when find with names fails', async () => {
    mock.getMany.mockRejectedValue(err);

    expect(async () => {
      await repo.findWithNames();
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.innerJoinAndSelect).toHaveBeenCalledTimes(1);
    expect(mock.innerJoin).toHaveBeenCalledTimes(2);
    expect(mock.addSelect).toHaveBeenCalledTimes(2);
    expect(mock.getMany).toHaveBeenCalledTimes(1);
  });

  it('should find paginated', async () => {
    const res = await repo.findPaginated(1, 1);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.offset).toHaveBeenCalledTimes(1);
    expect(mock.offset).toHaveBeenCalledWith(1);
    expect(mock.limit).toHaveBeenCalledTimes(1);
    expect(mock.limit).toHaveBeenCalledWith(1);
    expect(mock.orderBy).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);

    expect(res).toEqual(result);
  });

  it('should throw an error when find paginated fails', async () => {
    mock.getMany.mockRejectedValue(err);

    expect(async () => {
      await repo.findPaginated(1, 1);
    }).rejects.toThrow(err);

    expect(mock.offset).toHaveBeenCalledTimes(1);
    expect(mock.offset).toHaveBeenCalledWith(1);
    expect(mock.limit).toHaveBeenCalledTimes(1);
    expect(mock.limit).toHaveBeenCalledWith(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);
  });
});
