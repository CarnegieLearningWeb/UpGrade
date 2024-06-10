export const initializeMocks = (result) => {
  const mocks = {
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    whereInIds: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    into: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orUpdate: jest.fn().mockReturnThis(),
    orIgnore: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue(result),
    getQuery: jest.fn().mockReturnValue(1),
    getCount: jest.fn().mockResolvedValue(5),
    getMany: jest.fn().mockResolvedValue(result),
    getOne: jest.fn().mockResolvedValue(result.raw[0]),
  };

  const createQueryBuilder = jest.fn().mockReturnValue({
    insert: mocks.insert,
    update: mocks.update,
    delete: mocks.delete,
    values: mocks.values,
    returning: mocks.returning,
    select: mocks.select,
    addSelect: mocks.addSelect,
    orderBy: mocks.orderBy,
    limit: mocks.limit,
    offset: mocks.offset,
    from: mocks.from,
    where: mocks.where,
    whereInIds: mocks.whereInIds,
    andWhere: mocks.andWhere,
    into: mocks.into,
    set: mocks.set,
    groupBy: mocks.groupBy,
    addGroupBy: mocks.groupBy,
    orUpdate: mocks.orUpdate,
    orIgnore: mocks.orIgnore,
    setParameter: mocks.setParameter,
    leftJoin: mocks.leftJoin,
    leftJoinAndSelect: mocks.leftJoinAndSelect,
    innerJoin: mocks.innerJoin,
    innerJoinAndSelect: mocks.innerJoinAndSelect,
    execute: mocks.execute,
    getQuery: mocks.getQuery,
    getCount: mocks.getCount,
    getMany: mocks.getMany,
    getOne: mocks.getOne,
  });

  return { createQueryBuilder, mocks };
};
