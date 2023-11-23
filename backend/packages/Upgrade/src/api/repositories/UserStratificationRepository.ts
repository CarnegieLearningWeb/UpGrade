import { Repository, EntityRepository } from 'typeorm';
import { UserStratificationFactor } from '../models/UserStratificationFactor';

@EntityRepository(UserStratificationFactor)
export class UserStratificationFactorRepository extends Repository<UserStratificationFactor> {
}
