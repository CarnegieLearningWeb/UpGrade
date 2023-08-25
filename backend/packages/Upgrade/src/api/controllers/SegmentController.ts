import { JsonController, Get, Delete, Param, Authorized, Post, Req, Body } from 'routing-controllers';
import { SegmentService } from '../services/SegmentService';
import { Segment } from '../models/Segment';
import { SERVER_ERROR } from 'upgrade_types';
import { isUUID } from 'class-validator';
import { AppRequest } from '../../types';
import { SegmentInputValidator } from './validators/SegmentInputValidator';
import { ExperimentSegmentInclusion } from '../models/ExperimentSegmentInclusion';
import { ExperimentSegmentExclusion } from '../models/ExperimentSegmentExclusion';

export interface getSegmentData {
  segmentsData: Segment[];
  experimentSegmentInclusionData: Partial<ExperimentSegmentInclusion>[];
  experimentSegmentExclusionData: Partial<ExperimentSegmentExclusion>[];
}

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
 *   - name: Segment
 *     description: CRUD operations related to Segment
 */
@Authorized()
@JsonController('/segments')
export class SegmentController {
  constructor(public segmentService: SegmentService) {}

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
  public async getAllSegments(@Req() request: AppRequest): Promise<getSegmentData> {
    return this.segmentService.getAllSegmentWithStatus(request.logger);
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
  @Get('/:segmentId')
  public getSegmentById(@Param('segmentId') segmentId: string, @Req() request: AppRequest): Promise<Segment> {
    if (!segmentId) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : segmentId should not be null.'));
    }
    if (!isUUID(segmentId)) {
      return Promise.reject(
        new Error(
          JSON.stringify({ type: SERVER_ERROR.INCORRECT_PARAM_FORMAT, message: ' : segmentId should be of type UUID.' })
        )
      );
    }
    return this.segmentService.getSegmentById(segmentId, request.logger);
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
  public upsertSegment(
    @Body({ validate: true }) segment: SegmentInputValidator,
    @Req() request: AppRequest
  ): Promise<Segment> {
    return this.segmentService.upsertSegment(segment, request.logger);
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
  @Delete('/:segmentId')
  public deleteSegment(@Param('segmentId') segmentId: string, @Req() request: AppRequest): Promise<Segment> {
    if (!segmentId) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : segmentId should not be null.'));
    }
    if (!isUUID(segmentId)) {
      return Promise.reject(
        new Error(
          JSON.stringify({ type: SERVER_ERROR.INCORRECT_PARAM_FORMAT, message: ' : segmentId should be of type UUID.' })
        )
      );
    }
    return this.segmentService.deleteSegment(segmentId, request.logger);
  }

  /**
   * @swagger
   * /segments/import:
   *    post:
   *      description: Import a new segment
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
   *          description: Import a new segment
   *          schema:
   *            $ref: '#/definitions/segmentResponse'
   *        '401':
   *          description: Authorization Required Error
   *        '500':
   *          description: Internal Server Error, Insert Error in database, SegmentId is not valid, JSON format is not valid
   */
  @Post('/import')
  public importSegments(
    @Body({ validate: false }) segments: SegmentInputValidator[],
    @Req() request: AppRequest
  ): Promise<Segment[]> {
    return this.segmentService.importSegments(segments, request.logger);
  }

  @Post('/export')
  public exportSegments(@Body({ validate: false }) ids: string[], @Req() request: AppRequest): Promise<Segment[]> {
    if (!ids) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : segmentId should not be null.'));
    }
    for (const id of ids) {
      if (!isUUID(id)) {
        return Promise.reject(
          new Error(
            JSON.stringify({
              type: SERVER_ERROR.INCORRECT_PARAM_FORMAT,
              message: ' : segmentId should be of type UUID.',
            })
          )
        );
      }
    }
    return this.segmentService.exportSegments(ids, request.logger);
  }
}
