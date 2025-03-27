import { Service } from 'typedi';

@Service()
export default class ExcludeServiceMock {
  public getAllSegments(): Promise<[]> {
    return Promise.resolve([]);
  }

  public getAllSegmentWithStatus(): Promise<[]> {
    return Promise.resolve([]);
  }
  
  public getSegmentById(id: string): Promise<[]> {
    return Promise.resolve([]);
  }

  public getSegmentWithStatusById(id: string): Promise<[]> {
    return Promise.resolve([]);
  }

  public getSingleSegmentWithStatus(id: string): Promise<[]> {
    return Promise.resolve([]);
  }

  public upsertSegment(): Promise<[]> {
    return Promise.resolve([]);
  }

  public importSegments(): Promise<[]> {
    return Promise.resolve([]);
  }

  public deleteSegment(id: string): Promise<[]> {
    return Promise.resolve([]);
  }

  public validateSegments(): Promise<[]> {
    return Promise.resolve([]);
  }

  public validateSegmentsForCommonImportModal(): Promise<[]> {
    return Promise.resolve([]);
  }

  public exportSegments(id: string): Promise<[]> {
    return Promise.resolve([]);
  }

  public exportSegment(id: string): Promise<[]> {
    return Promise.resolve([]);
  }

  public exportSegmentCSV(id: string): Promise<[]> {
    return Promise.resolve([]);
  }
}
