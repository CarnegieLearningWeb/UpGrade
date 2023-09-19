import { JsonController, Get, Delete, Param, Authorized, Post, Req, UseBefore, Res, Body, UploadedFile } from 'routing-controllers';
import { SERVER_ERROR } from 'upgrade_types';
import { isUUID } from 'class-validator';
import { AppRequest } from '../../types';
import { UserStratificationFactor } from '../models/UserStratificationFactor';
import { StratificationService } from '../services/StratificationService';
import { FactorStrata, StratificationInputValidator } from './validators/StratificationValidator';
import { StratificationFactor } from '../models/StratificationFactor';
import * as express from 'express';
import { Parser } from 'json2csv';

import formidable, { errors as formidableErrors } from 'formidable';
import { CSVMiddleware } from '../middlewares/BodyParserMiddleware copy';
import multer from 'multer';
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const fs = require('fs');
const { parse } = require('csv-parse');


// import { CSVMiddleware } from '../middlewares/BodyParserMiddleware copy';
// import multer from 'multer';
import { createObjectCsvWriter } from 'csv-writer';

// //const multer = require('multer');
// let storage = multer.memoryStorage();
// let upload = multer({ storage: storage });
// const fs = require('fs');
// const { parse } = require('csv-parse');

/**
 * @swagger
 * definitions:
 *   Segment:
 *     required:
 *       - name
 *       - description
 *       - context
 *       - type
 *       - userIds
 *       - groups
 *       - subSegmentIds
 *     properties:
 *       name:
 *         type: string
 *       description:
 *         type: string
 *       context:
 *         type: string
 *       type:
 *         type: string
 *         enum: [public, private]
 *       userIds:
 *         type: array
 *         items:
 *           type: string
 *       groups:
 *         type: array
 *         items:
 *           type: object
 *           properties:
 *             groupId:
 *               type: string
 *             type:
 *               type: string
 *       subSegmentIds:
 *         type: array
 *         items:
 *           type: string
 *   segmentResponse:
 *     description: ''
 *     type: object
 *     required:
 *       - createdAt
 *       - updatedAt
 *        - versionNumber
 *       - id
 *       - name
 *       - description
 *       - context
 *       - type
 *       - individualForSegment
 *       - groupForSegment
 *       - subSegments
 *     properties:
 *       createdAt:
 *         type: string
 *         minLength: 1
 *       updatedAt:
 *         type: string
 *         minLength: 1
 *       versionNumber:
 *         type: number
 *       id:
 *         type: string
 *         minLength: 1
 *       name:
 *         type: string
 *         minLength: 1
 *       description:
 *         type: string
 *         minLength: 1
 *       context:
 *         type: string
 *         minLength: 1
 *       type:
 *         type: string
 *         minLength: 1
 *       individualForSegment:
 *         type: array
 *         uniqueItems: true
 *         items:
 *           type: object
 *           required:
 *             - createdAt
 *             - updatedAt
 *             - versionNumber
 *             - userId
 *           properties:
 *             createdAt:
 *               type: string
 *               minLength: 1
 *             updatedAt:
 *               type: string
 *               minLength: 1
 *             versionNumber:
 *               type: number
 *             userId:
 *               type: string
 *               minLength: 1
 *       groupForSegment:
 *         type: array
 *         uniqueItems: true
 *         items:
 *           type: object
 *           required:
 *             - createdAt
 *             - updatedAt
 *             - versionNumber
 *             - groupId
 *             - type
 *           properties:
 *             createdAt:
 *               type: string
 *               minLength: 1
 *             updatedAt:
 *               type: string
 *               minLength: 1
 *             versionNumber:
 *               type: number
 *             groupId:
 *               type: string
 *               minLength: 1
 *             type:
 *               type: string
 *               minLength: 1
 *       subSegments:
 *         type: array
 *         uniqueItems: true
 *         items:
 *           type: object
 *           required:
 *             - createdAt
 *             - updatedAt
 *             - versionNumber
 *             - id
 *             - name
 *             - description
 *             - context
 *             - type
 *           properties:
 *             createdAt:
 *               type: string
 *               minLength: 1
 *             updatedAt:
 *               type: string
 *               minLength: 1
 *             versionNumber:
 *               type: number
 *             id:
 *               type: string
 *               minLength: 1
 *             name:
 *               type: string
 *               minLength: 1
 *             description:
 *               type: string
 *               minLength: 1
 *             context:
 *               type: string
 *               minLength: 1
 *             type:
 *               type: string
 *               minLength: 1
 */

/**
 * @swagger
 * tags:
 *   - name: Stratification
 *     description: CRUD operations related to Stratification
 */
@Authorized()
@JsonController('/stratification')
export class StratificationController {
  constructor(public stratificatonService: StratificationService) {}

  /**
   * @swagger
   * /segments:
   *    get:
   *       description: Get all segments
   *       tags:
   *         - Segment
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Get all segments
   *            schema:
   *              type: array
   *              items:
   *                $ref: '#/definitions/segmentResponse'
   *          '401':
   *            description: Authorization Required Error
   */
  @Get()
  public async getAllStratification(@Req() request: AppRequest): Promise<FactorStrata[]> {
    return this.stratificatonService.getAllStratification(request.logger);
  }

  /**
   * @swagger
   * /segments/{segmentId}:
   *    get:
   *      description: Get segment by id
   *      tags:
   *        - Segment
   *      produces:
   *        - application/json
   *      parameters:
   *        - in: path
   *          name: segmentId
   *          description: Segment id
   *          required: true
   *          schema:
   *            type: string
   *      responses:
   *        '200':
   *          description: Get segment by id
   *          schema:
   *            $ref: '#/definitions/segmentResponse'
   *        '401':
   *          description: Authorization Required Error
   *        '404':
   *          description: Segment not found
   *        '500':
   *          description: Internal Server Error, SegmentId is not valid
   */
  @Get('/download/:factor')
  // @UseBefore(CSVMiddleware)
  public async getStratificationByFactorId(
    @Param('factor') factor: string,
    @Req() request: AppRequest,
    @Res() res: express.Response
  ): Promise<any> {
    if (!factor) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : stratification Factor should not be null.'));
    }
    if (!isUUID(factor)) {
      return Promise.reject(
        new Error(
          JSON.stringify({
            type: SERVER_ERROR.INCORRECT_PARAM_FORMAT,
            message: ' : stratification Factor should be of type UUID.',
          })
        )
      );
    }

    // const csv = JSONToCSV(req.body, { fields: ["Customer Name", "Business Name", "Customer Email", "Customer ID", "School ID", "Student Count", "Admin Count", "Courses Count" ]})

    // res.attachment('customers.csv').send(csv)

    /*const data = [
      { name: 'Alice', age: 25, city: 'New York' },
      { name: 'Bob', age: 30, city: 'Los Angeles' },
      { name: 'Charlie', age: 22, city: 'Chicago' },
    ];

    // Create a CSV writer
    const csvWriter = createObjectCsvWriter({
      path: 'data.csv',
      header: [
        { id: 'name', title: 'Name' },
        { id: 'age', title: 'Age' },
        { id: 'city', title: 'City' },
      ],
    });

    // Write the data to the CSV file
    csvWriter
      .writeRecords(data)
      .then(() => {
        // Set the response headers to specify a CSV content type and trigger download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=data.csv');
        res.set('Content-Type', 'text/csv; charset=UTF-8');

        // Pipe the CSV file to the response
        const fileStream = fs.createReadStream('data.csv');
        fileStream.pipe(res);
      })
      .catch((error) => {
        console.error('Error writing CSV:', error);
        res.status(500).send('Internal Server Error');
      });*/

    const data = await this.stratificatonService.getCSVDataByFactor(factor, request.logger);
    const parser = new Parser();
    // Convert JSON data to CSV
    const csv = parser.parse(data);

    // return csv file with appropriate headers to request;


    console.log(csv);
    res.setHeader('Content-Type', 'text/csv; charset=UTF-8');
    res.setHeader('Content-Disposition', 'attachment; filename="data.csv"');
    res.send(csv);
    return;
  }

  /**
   * @swagger
   * /segments:
   *    post:
   *      description: Create a new segment
   *      tags:
   *        - Segment
   *      produces:
   *        - application/json
   *      parameters:
   *        - in: body
   *          name: segment
   *          description: Segment object
   *          required: true
   *          schema:
   *            type: object
   *            $ref: '#/definitions/Segment'
   *      responses:
   *        '200':
   *          description: Create a new segment
   *          schema:
   *            $ref: '#/definitions/segmentResponse'
   *        '401':
   *          description: Authorization Required Error
   *        '500':
   *          description: Internal Server Error, Insert Error in database, SegmentId is not valid, JSON format is not valid
   */
  @Post()
  @UseBefore(upload.single('file'))
  public insertStratification(@Req() request: AppRequest): Promise<UserStratificationFactor[]> {
    const csvData = request.file['buffer'].toString();
    console.log(csvData.toString()); // TODO: remove this

    const rows = csvData.split('\n');
    const columnNames = rows[0].split(',');

    const userFactorValues: StratificationInputValidator[] = [];

    // Iterate through the rows (skip the header row)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowValues = row.split(',');

      // Extract the user ID
      const userId = rowValues[0];
      if (!userId) {
        continue;
      }

      // Iterate through other columns (factors)
      for (let j = 1; j < columnNames.length; j++) {
        const factorName = columnNames[j];
        const factorValue = rowValues[j];

        // Create an object and add it to the array
        const userFactorValue: StratificationInputValidator = {
          userId: userId,
          factor: factorName.trim(),
          value: factorValue ? factorValue.trim() : null,
        };

        userFactorValues.push(userFactorValue);
      }
    }

    return this.stratificatonService.insertStratification(userFactorValues, request.logger);
  }

  /**
   * @swagger
   * /segments/{segmentId}:
   *    delete:
   *      description: Delete a segment
   *      tags:
   *      - Segment
   *      produces:
   *        - application/json
   *      parameters:
   *        - in: path
   *          name: segmentId
   *          description: Segment id
   *          required: true
   *          schema:
   *            type: string
   *      responses:
   *        '200':
   *          description: Delete a segment
   *          schema:
   *            $ref: '#/definitions/segmentResponse'
   *        '401':
   *          description: Authorization Required Error
   *        '500':
   *          description: Internal Server Error, SegmentId is not valid
   */
  @Delete('/:factor')
  public deleteStratification(
    @Param('factor') stratificationFactor: string,
    @Req() request: AppRequest
  ): Promise<StratificationFactor> {
    if (!stratificationFactor) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : stratification Factor should not be null.'));
    }
    if (!isUUID(stratificationFactor)) {
      return Promise.reject(
        new Error(
          JSON.stringify({
            type: SERVER_ERROR.INCORRECT_PARAM_FORMAT,
            message: ' : stratification Factor should be of type UUID.',
          })
        )
      );
    }
    return this.stratificatonService.deleteStratification(stratificationFactor, request.logger);
  }
}
