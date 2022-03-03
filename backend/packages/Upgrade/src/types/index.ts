import { Request } from 'express';
import { UpgradeLogger } from '../lib/logger/UpgradeLogger';

export enum ASSIGNMENT_TYPE {
  MANUAL = 'manual',
  ALGORITHMIC = 'algorithmic',
}

export enum SORT_AS {
  ASCENDING = 'ASC',
  DESCENDING = 'DESC',
}

export interface PaginationResponse {
  total: number;
  skip: number;
  take: number;
}

export interface AppRequest extends Request {
  logger: UpgradeLogger;
}
