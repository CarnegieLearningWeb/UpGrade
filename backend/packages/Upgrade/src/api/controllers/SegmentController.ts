import { JsonController, Get, Delete, Param, Authorized, Post, Req, Body, QueryParams } from 'routing-controllers';
import { SegmentService, SegmentWithStatus } from '../services/SegmentService';
import { Segment } from '../models/Segment';
import { SERVER_ERROR } from 'upgrade_types';
import { isUUID } from 'class-validator';
import { AppRequest } from '../../types';
import { SegmentFile, SegmentIds, SegmentImportError, SegmentInputValidator } from './validators/SegmentInputValidator';
import { ExperimentSegmentInclusion } from '../models/ExperimentSegmentInclusion';
import { ExperimentSegmentExclusion } from '../models/ExperimentSegmentExclusion';
import { BadRequestException, NotFoundException } from '@nestjs/common/exceptions';

export interface getSegmentData {
  segmentsData: SegmentWithStatus[];
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
 *           example: '5812a759-1dcf-47a8-b0ba-26c89092863e'
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
   *            example: '5812a759-1dcf-47a8-b0ba-26c89092863e'
   *      responses:
   *        '200':
   *          description: Get segment by id
   *          schema:
   *            $ref: '#/definitions/segmentResponse'
   *        '400':
   *          description: segmentId should be a valid UUID.
   *        '401':
   *          description: Authorization Required Error
   *        '404':
   *          description: Segment not found
   *        '500':
   *          description: Internal Server Error, SegmentId is not valid
   */
  @Get('/:segmentId')
  public async getSegmentById(@Param('segmentId') segmentId: string, @Req() request: AppRequest): Promise<Segment> {
    if (!segmentId || !isUUID(segmentId)) {
      throw new BadRequestException('segmentId should be a valid UUID.');
    }

    const segment = await this.segmentService.getSegmentById(segmentId, request.logger);
    if (!segment) {
      throw new NotFoundException('Segment not found.');
    }

    return segment;
  }

  /**
   * @swagger
   * /segments/status/{segmentId}:
   *    get:
   *      description: Get segment by id with status
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
   *        '400':
   *          description: segmentId should be a valid UUID.
   *        '401':
   *          description: Authorization Required Error
   *        '404':
   *          description: Segment not found
   *        '500':
   *          description: Internal Server Error, SegmentId is not valid
   */
  @Get('/status/:segmentId')
  public async getSegmentWithStatusById(
    @Param('segmentId') segmentId: string,
    @Req() request: AppRequest
  ): Promise<Segment> {
    if (!segmentId || !isUUID(segmentId)) {
      throw new BadRequestException('segmentId should be a valid UUID.');
    }

    const segment = await this.segmentService.getSingleSegmentWithStatus(segmentId, request.logger);
    if (!segment) {
      throw new NotFoundException('Segment not found.');
    }
    return segment;
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
   *            example: '5812a759-1dcf-47a8-b0ba-26c89092863e'
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
    @Body({ validate: true }) segments: SegmentFile[],
    @Req() request: AppRequest
  ): Promise<SegmentImportError[]> {
    return this.segmentService.importSegments(segments, request.logger);
  }

  /**
   * @swagger
   * /segments/validation:
   *    post:
   *       description: Validating Segments
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: params
   *           description: Segment file
   *           required: true
   *           schema:
   *            type: object
   *            properties:
   *              fileName:
   *                type: string
   *              fileContent:
   *                type: string
   *       tags:
   *         - Segment
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Validations are done
   *          '401':
   *            description: AuthorizationRequiredError
   */
  @Post('/validation')
  public validateSegments(
    @Body({ validate: true }) segments: SegmentFile[],
    @Req() request: AppRequest
  ): Promise<SegmentImportError[]> {
    return this.segmentService.validateSegments(segments, request.logger);
  }

  /**
   * @swagger
   * /segments/export/json:
   *    get:
   *      description: Get segment JSON export
   *      produces:
   *        - application/json
   *      parameters:
   *        - in: path
   *          name: segmentId
   *          description: Segment id
   *          required: true
   *          schema:
   *            type: array
   *            items:
   *              type: string
   *              example: '5812a759-1dcf-47a8-b0ba-26c89092863e'
   *      tags:
   *        - Segment
   *      responses:
   *          '200':
   *            description: Get segment JSON export
   *          '401':
   *            description: AuthorizationRequiredError
   */
  @Get('/export/json')
  public exportSegments(
    @QueryParams()
    params: SegmentIds,
    @Req() request: AppRequest
  ): Promise<Segment[]> {
    const segmentIds = params.ids;
    return this.segmentService.exportSegments(segmentIds, request.logger);
  }

  /**
   * @swagger
   * /segments/export/csv:
   *    get:
   *      description: Get segment csv export
   *      produces:
   *        - application/json
   *      parameters:
   *        - in: path
   *          name: segmentId
   *          description: Segment id
   *          required: true
   *          schema:
   *            type: array
   *            items:
   *              type: string
   *              example: '5812a759-1dcf-47a8-b0ba-26c89092863e'
   *      tags:
   *        - Segment
   *      responses:
   *          '200':
   *            description: Get segment csv export
   *          '401':
   *            description: AuthorizationRequiredError
   */
  @Get('/export/csv')
  public exportSegment(
    @QueryParams()
    params: SegmentIds,
    @Req() request: AppRequest
  ): Promise<SegmentFile[]> {
    const segmentIds = params.ids;
    return this.segmentService.exportSegmentCSV(segmentIds, request.logger);
  }
}
