import {
  JsonController,
  Get,
  Delete,
  Authorized,
  Post,
  Req,
  Body,
  QueryParams,
  Params,
  BadRequestError,
} from 'routing-controllers';
import { SegmentService, SegmentWithStatus } from '../services/SegmentService';
import { Segment } from '../models/Segment';
import { AppRequest, PaginationResponse } from '../../types';
import { IImportError, SEGMENT_STATUS } from 'upgrade_types';
import {
  DeleteListInputValidator,
  IdValidator,
  ListInputValidator,
  SegmentFile,
  SegmentIds,
  SegmentIdValidator,
  SegmentImportError,
  SegmentInputValidator,
  SegmentListImportValidation,
} from './validators/SegmentInputValidator';
import { SegmentPaginatedParamsValidator } from './validators/SegmentPaginatedParamsValidator';
import { ExperimentSegmentInclusion } from '../models/ExperimentSegmentInclusion';
import { ExperimentSegmentExclusion } from '../models/ExperimentSegmentExclusion';
import { NotFoundException } from '@nestjs/common/exceptions';
import { ValidatedImportResponse } from 'upgrade_types';
interface inclusionExclusionData {
  experimentSegmentInclusionData: Partial<ExperimentSegmentInclusion>[];
  experimentSegmentExclusionData: Partial<ExperimentSegmentExclusion>[];
  featureFlagSegmentInclusionData: Partial<ExperimentSegmentInclusion>[];
  featureFlagSegmentExclusionData: Partial<ExperimentSegmentExclusion>[];
}

export interface getSegmentsData extends inclusionExclusionData {
  segmentsData: Segment[];
}
export interface getSegmentData extends inclusionExclusionData {
  segment: Segment;
}
interface SegmentPaginationInfo extends PaginationResponse {
  nodes: getSegmentsData;
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
 *   ListInput:
 *    allOf:
 *      - $ref: '#/definitions/Segment'
 *    required:
 *      - parentSegmentId
 *      - listType
 *    properties:
 *        parentSegmentId:
 *         type: string
 *        listType:
 *         type: string
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
  public async getAllSegments(@Req() request: AppRequest): Promise<getSegmentsData> {
    return this.segmentService.getAllSegmentWithStatus(request.logger);
  }

  /**
   * @swagger
   * /segments/global:
   *    get:
   *       description: Get all global segments
   *       tags:
   *         - Segment
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Get all global segments
   *            schema:
   *              type: array
   *              items:
   *                $ref: '#/definitions/segmentResponse'
   *          '401':
   *            description: Authorization Required Error
   */
  @Get('/global')
  public async getAllGlobalSegments(@Req() request: AppRequest): Promise<SegmentWithStatus[]> {
    const globalExcludeSegments = await this.segmentService.getAllGlobalExcludeSegments(request.logger);
    return globalExcludeSegments.map((segment) => {
      return {
        ...segment,
        status: SEGMENT_STATUS.EXCLUDED,
      };
    });
  }

  /**
   * @swagger
   * /segments/paginated:
   *    post:
   *       description: Get Paginated Segments
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: params
   *           required: true
   *           schema:
   *             type: object
   *             required:
   *               - skip
   *               - take
   *             properties:
   *               skip:
   *                type: integer
   *               take:
   *                type: integer
   *               searchParams:
   *                type: object
   *                properties:
   *                  key:
   *                    type: string
   *                    enum: [all, name, tag, context]
   *                  string:
   *                    type: string
   *               sortParams:
   *                  type: object
   *                  properties:
   *                    key:
   *                     type: string
   *                     enum: [name, updatatedAt]
   *                    sortAs:
   *                     type: string
   *                     enum: [ASC, DESC]
   *       tags:
   *         - Segment
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Get Paginated Segments
   *            schema:
   *              type: object
   *              properties:
   *                total:
   *                  type: number
   *                nodes:
   *                  type: array
   *                  items:
   *                    $ref: '#/definitions/SegmentResponse'
   *          '401':
   *            description: AuthorizationRequiredError
   *          '500':
   *            description: Insert Error in database
   */
  @Post('/paginated')
  public async getAllSegmentsPaginated(
    @Body({ validate: true })
    paginatedParams: SegmentPaginatedParamsValidator,
    @Req() request: AppRequest
  ): Promise<SegmentPaginationInfo> {
    const [segmentsWithStatus, count] = await Promise.all([
      this.segmentService.findPaginated(
        paginatedParams.skip,
        paginatedParams.take,
        request.logger,
        paginatedParams.searchParams,
        paginatedParams.sortParams
      ),
      this.segmentService.getTotalPublicSegmentCount(),
    ]);
    return {
      total: count,
      nodes: segmentsWithStatus,
      ...paginatedParams,
    };
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
  public async getSegmentById(
    @Params({ validate: true }) { segmentId }: IdValidator,
    @Req() request: AppRequest
  ): Promise<Segment> {
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
    @Params({ validate: true }) { segmentId }: IdValidator,
    @Req() request: AppRequest
  ): Promise<getSegmentData> {
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
    const contextValidationError = this.segmentService.validateSegmentContext(segment);
    if (contextValidationError) {
      throw new BadRequestError(contextValidationError);
    }

    return this.segmentService.upsertSegment(segment, request.logger);
  }

  /**
   * @swagger
   * /list:
   *    post:
   *      description: Create a new list
   *      tags:
   *        - Segment
   *      produces:
   *        - application/json
   *      parameters:
   *        - in: body
   *          name: list
   *          description: List object
   *          required: true
   *          schema:
   *            type: object
   *            $ref: '#/definitions/ListInput'
   *      responses:
   *        '200':
   *          description: Create a new list
   *          schema:
   *            $ref: '#/definitions/segmentResponse'
   *        '401':
   *          description: Authorization Required Error
   *        '500':
   *          description: Internal Server Error, Insert Error in database, SegmentId is not valid, JSON format is not valid
   */
  @Post('/list')
  public addList(
    @Body({ validate: true }) listInput: ListInputValidator,
    @Req() request: AppRequest
  ): Promise<Segment> {
    return this.segmentService.addList(listInput, request.logger);
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
  public deleteSegment(
    @Params({ validate: true }) { segmentId }: SegmentIdValidator,
    @Req() request: AppRequest
  ): Promise<Segment> {
    return this.segmentService.deleteSegment(segmentId, request.logger);
  }

  /**
   * @swagger
   * /segments/list/{segmentId}:
   *    delete:
   *      description: Delete a list from a parent segment
   *      tags:
   *      - Segment
   *      produces:
   *        - application/json
   *      parameters:
   *        - in: path
   *          name: segmentId
   *          description: List id
   *          required: true
   *          schema:
   *            type: string
   *            example: '5812a759-1dcf-47a8-b0ba-26c89092863e'
   *        - in: body
   *          name: parentSegmentId
   *          description: Parent segment id
   *          schema:
   *            type: string
   *            example: '5812a759-1dcf-47a8-b0ba-26c89092863e'
   *          required: true
   *      responses:
   *        '200':
   *          description: Delete a segment list
   *          schema:
   *            $ref: '#/definitions/segmentResponse'
   *        '401':
   *          description: Authorization Required Error
   *        '500':
   *          description: Internal Server Error, SegmentId is not valid
   */
  @Delete('/list/:segmentId')
  public deleteList(
    @Params({ validate: true }) { segmentId }: SegmentIdValidator,
    @Body({ validate: true }) { parentSegmentId }: DeleteListInputValidator,

    @Req() request: AppRequest
  ): Promise<Segment> {
    return this.segmentService.deleteList(segmentId, parentSegmentId, request.logger);
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
   * /segments/list/import:
   *    post:
   *      description: Import a list to a parent segment
   *      tags:
   *        - Segment
   *      produces:
   *        - application/json
   *      parameters:
   *        - in: body
   *          name: segment
   *          description: Segment list object
   *          required: true
   *          schema:
   *            type: object
   *            $ref: '#/definitions/Segment'
   *      responses:
   *        '200':
   *          description:  Import a list to a parent segment
   *          schema:
   *            $ref: '#/definitions/segmentResponse'
   *        '401':
   *          description: Authorization Required Error
   *        '500':
   *          description: Internal Server Error, Insert Error in database, SegmentId is not valid, JSON format is not valid
   */
  @Post('/list/import')
  public importLists(
    @Body({ validate: true }) lists: SegmentListImportValidation,
    @Req() request: AppRequest
  ): Promise<IImportError[]> {
    return this.segmentService.importLists(lists, request.logger);
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
   *           name: segments
   *           description: Segment file
   *           required: true
   *           schema:
   *             type: array
   *             items:
   *               type: object
   *               properties:
   *                 fileName:
   *                   type: string
   *                 fileContent:
   *                   type: string
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
   * /segments/import/validation:
   *    post:
   *       description: Validating Segments with response for Common Import Modal
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: segments
   *           description: Segment file
   *           required: true
   *           schema:
   *             type: array
   *             items:
   *               type: object
   *               properties:
   *                 fileName:
   *                   type: string
   *                 fileContent:
   *                   type: string
   *       tags:
   *         - Segment
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: An array of ValidatedImportResponse
   *          '401':
   *            description: AuthorizationRequiredError
   */
  @Post('/import/validation')
  public validateImportedSegments(
    @Body({ validate: true }) segments: SegmentFile[],
    @Req() request: AppRequest
  ): Promise<ValidatedImportResponse[]> {
    return this.segmentService.validateSegmentsForCommonImportModal(segments, request.logger);
  }

  /**
   * @swagger
   * /segments/list/import/validation:
   *    post:
   *       description: Validating Segments with response for Common Import Modal
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: segments
   *           description: Segment file
   *           required: true
   *           schema:
   *             type: array
   *             items:
   *               type: object
   *               properties:
   *                 fileName:
   *                   type: string
   *                 fileContent:
   *                   type: string
   *       tags:
   *         - Segment
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: An array of ValidatedImportResponse
   *          '401':
   *            description: AuthorizationRequiredError
   */
  @Post('/list/import/validation')
  public validateImportedLists(
    @Body({ validate: true }) segments: SegmentFile[],
    @Req() request: AppRequest
  ): Promise<ValidatedImportResponse[]> {
    return this.segmentService.validateListsImport(segments, request.logger);
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
