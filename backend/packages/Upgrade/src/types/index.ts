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
