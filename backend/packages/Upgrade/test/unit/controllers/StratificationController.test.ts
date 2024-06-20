import app from '../../utils/expressApp';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { configureLogger } from '../../utils/logger';
import { useContainer as routingUseContainer } from 'routing-controllers';
import { Container } from 'typedi';
import StratificationServiceMock from './mocks/StratificationServiceMock';
import { StratificationService } from '../../../src/api/services/StratificationService';
import { useContainer as classValidatorUseContainer } from 'class-validator';
import { useContainer as ormUseContainer } from 'typeorm';

describe('Stratification Controller Testing', () => {
  beforeAll(() => {
    configureLogger();
    routingUseContainer(Container);
    ormUseContainer(Container);
    classValidatorUseContainer(Container);

    Container.set(StratificationService, new StratificationServiceMock());
  });

  afterAll(() => {
    Container.reset();
  });

  test('Get request for /api/stratification', () => {
    return request(app).get('/api/stratification').expect('Content-Type', /json/).expect(200);
  });

  const factorName = 'factor1';

  test('Post request for /api/stratification', async () => {
    const jsonData = [
      { uuid: 'User', Graduated: 'yes' },
      { uuid: 'Alice', Graduated: 'no' },
    ];

    const csvData = Papa.unparse(jsonData);

    // Create a temporary CSV file
    const tempCsvFilePath = path.join(__dirname, `${factorName}.csv`);
    fs.writeFileSync(tempCsvFilePath, csvData);

    const requestBody = { files: [{ file: fs.readFileSync(tempCsvFilePath, 'utf-8') }] };

    await request(app)
      .post(`/api/stratification`)
      .send(requestBody)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    fs.unlinkSync(tempCsvFilePath);
    return;
  });

  test('Get request for /api/stratification/download/:factor', () => {
    return request(app)
      .get(`/api/stratification/download/${factorName}`)
      .expect('Content-Type', 'text/csv; charset=utf-8')
      .expect(200);
  });

  test('Delete request for /api/stratification/:factor', () => {
    return request(app).delete(`/api/stratification/${factorName}`).expect('Content-Type', /json/).expect(200);
  });
});
