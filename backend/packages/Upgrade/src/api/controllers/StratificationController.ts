import { JsonController, Get, Delete, Param, Authorized, Post, Req, Body } from 'routing-controllers';
import { SERVER_ERROR } from 'upgrade_types';
import { isUUID } from 'class-validator';
import { AppRequest } from '../../types';
import { UserStratificationFactor } from '../models/UserStratificationFactor';
import { StratificationService } from '../services/StratificationService';

const fs = require("fs");
const { parse } = require("csv-parse");

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
 *     description: CRUD operations related to Segment
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
  public async getAllStratification(@Req() request: AppRequest): Promise<StratificationResult[]> {
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
  public getStratificationById(
    @Param('factor') factor: string,
    @Req() request: AppRequest
  ): Promise<StratificationResult> {
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
    return this.stratificatonService.getStratificationByFactor(factor, request.logger);
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
  public insertStratification(
    @Body() temp: any,
    @Req() request: AppRequest,
  ): Promise<UserStratificationFactor[]> {

    // read csv file
    const { file } = request;
    fs.createReadStream(file)
      .pipe(parse({ delimiter: ",", from_line: 2 }))
      .on("data", function (row) {
      console.log(row);
    })
    return this.stratificatonService.insertStratification(request.logger);
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
  ): Promise<StratificationResult> {
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
