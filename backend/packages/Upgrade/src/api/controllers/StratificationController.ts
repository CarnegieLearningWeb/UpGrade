import { JsonController, Get, Delete, Param, Authorized, Post, Req, UseBefore, Res } from 'routing-controllers';
import { SERVER_ERROR } from 'upgrade_types';
import { AppRequest } from '../../types';
import { UserStratificationFactor } from '../models/UserStratificationFactor';
import { StratificationService } from '../services/StratificationService';
import { FactorStrata, StratificationInputValidator } from './validators/StratificationValidator';
import { StratificationFactor } from '../models/StratificationFactor';
import * as express from 'express';
import { Parser } from 'json2csv';
import multer from 'multer';
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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
  public async getStratificationByFactor(
    @Param('factor') factor: string,
    @Req() request: AppRequest,
    @Res() res: express.Response
  ): Promise<any> {
    if (!factor) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : stratification Factor should not be null.'));
    }

    const data = await this.stratificatonService.getCSVDataByFactor(factor, request.logger);

    // Convert JSON data to CSV
    const parser = new Parser();
    const csv = parser.parse(data);

    // return csv file with appropriate headers to request;
    res.setHeader('Content-Type', 'text/csv; charset=UTF-8');
    res.setHeader('Content-Disposition', 'attachment; filename="data.csv"');
    return res.send(csv);
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
    const csvData = request.body[0].file;
    const rows = csvData.replace(/"/g, '').split('\n');
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
        const factorValue = rowValues[j].trim();

        // Create an object and add it to the array
        const userFactorValue: StratificationInputValidator = {
          userId: userId,
          factor: factorName.trim(),
          value: factorValue === '' ? null : factorValue,
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
    return this.stratificatonService.deleteStratification(stratificationFactor, request.logger);
  }
}
