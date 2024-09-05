import { Repository } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import { UserStratificationFactor } from '../models/UserStratificationFactor';

@EntityRepository(UserStratificationFactor)
export class UserStratificationFactorRepository extends Repository<UserStratificationFactor> {}
