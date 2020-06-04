import { EntityRepository, Repository } from 'typeorm';
import { Query } from '../models/Query';

@EntityRepository(Query)
export class QueryRepository extends Repository<Query> {}
