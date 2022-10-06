import axios from "axios";
import { env } from "../env";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import chalk from "chalk";
import {
  ActualAssignedCondition,
  AssignmentResponseSummary,
  ExcludeIfReachedSuiteOptions,
  MockConditionAlias,
  MockDecisionPoint,
  MockExperimentCondition,
  SimpleSummary,
  SpecDetails,
  SpecResult,
  SpecResultsSummary,
  SpectSummaryMetadata,
} from "../mocks/SpecsDetails";
import { BasicUser, excludeIfReachedUsers, UserNameType } from "../mocks/Users";
import {
  AssignRequestBody,
  AssignResponse,
  ExperimentRequestResponseBody,
  InitUserRequestBody,
  MarkRequestBody,
  StatusRequestBody,
} from "../mocks/RequestResponse";
import {
  ConditionAssertion,
  ConditionCode,
  DecisionPointSite,
  SpecOverallPassFail,
} from "../constants";
import { ExcludeIfReachedSpecDetails } from "./ExcludeIfReachedTestScenarios";

export class ExcludeIfReachedTestSuite {
  private host: string;
  private authToken: string;
  private context: string;
  private detailedSummary: SpecResultsSummary[] = [];
  private simpleSummary: SimpleSummary[] = [];
  private writePath = "";
  private writeSimpleSummaryToFile: boolean;
  private writeDetailedSummaryToFile: boolean;
  private runThisManyTimes: number;
  private BANNER = chalk.bold.green;

  constructor(
    envHost: string,
    envContext: string,
    options: ExcludeIfReachedSuiteOptions
  ) {
    this.host = envHost;
    this.authToken = env.authToken;
    this.context = envContext;
    this.writeSimpleSummaryToFile = !!options.writeSimpleSummaryToFile;
    this.writeDetailedSummaryToFile = !!options.writeDetailedSummaryToFile;
    this.writePath = options.writePath || "";
    this.runThisManyTimes = options.runThisManyTimes || 1;

    console.log(this.BANNER(">>> Initializing tests for this host", this.host));
    console.log(this.BANNER(">>> Using this bearer token:", this.authToken));
    console.log(this.BANNER(">>> Using this context:", this.context));
  }

  /**
   * run all tests, or provide a partial list
   */

  public async run(scenarioLists: SpecDetails[][], partialList?: string[]) {
    const allTestScenarios = scenarioLists.flat();
    let testList: SpecDetails[] = [];
    console.log(this.BANNER(">>> Begin ExcludeIfReachedTests"));
    // Perform global setup steps

    if (partialList) {
      partialList.forEach((testName: string) => {
        const foundTest = allTestScenarios.find((details: SpecDetails) => {
          return details.id === testName;
        });
        if (foundTest) testList.push(foundTest);
      });
    } else {
      testList = ExcludeIfReachedSpecDetails;
    }

    await this.initializeUsers(excludeIfReachedUsers);

    // Execute tests (synchronously, async breaks the db, maybe there's a way...)
    await this.executeAllSpecsSynchronously(testList);

    this.logTheResults();
  }

  public logTheResults(): void {
    const JSONdetailedSummary = JSON.stringify(this.detailedSummary, null, 2);
    const JSONsimpleSummary = JSON.stringify(this.simpleSummary, null, 2);
    console.log(this.BANNER(">>> Tests finished."));
    console.log(this.BANNER(">>> Detailed summary:"));
    console.log(JSON.stringify(this.detailedSummary, null, 2));
    console.log(this.BANNER(">>> Overall Spec results:"));
    console.log(JSON.stringify(this.simpleSummary, null, 2));

    this.writeToFile(JSONdetailedSummary, JSONsimpleSummary);
  }

  public writeToFile(
    JSONdetailedSummary: string,
    JSONsimpleSummary: string
  ): void {
    const metaData: SpectSummaryMetadata = {
      date: new Date().toISOString(),
      environment: this.host,
      context: this.context,
      appVersion: "",
    };

    if (this.writeDetailedSummaryToFile) {
      fs.writeFileSync(
        `${this.writePath}DetailedSummary-${new Date().toISOString()}`,
        JSON.stringify(metaData, null, 2) + ",\n" + JSONdetailedSummary
      );
    }

    if (this.writeSimpleSummaryToFile) {
      fs.writeFileSync(
        `${this.writePath}SimpleSummary-${new Date().toISOString()}`,
        JSON.stringify(metaData, null, 2) + ",\n" + JSONsimpleSummary
      );
    }
  }

  public async executeAllSpecsSynchronously(testList: SpecDetails[]) {
    for (const details of testList) {
      const results = await this.executeSpec(details);
      this.publishSummaries(results, details);
    }
  }

  public publishSummaries(results: SpecResultsSummary, details: SpecDetails) {
    this.detailedSummary.push(results);
    this.simpleSummary.push({
      testName: details.id,
      description: details.description,
      result: results.assignResponseSummary.every(
        (summary: AssignmentResponseSummary) => {
          return summary.result?.overall === SpecOverallPassFail.PASS;
        }
      )
        ? SpecOverallPassFail.PASS
        : SpecOverallPassFail.FAIL,
    });
  }

  public async initializeUsers(users: BasicUser[]) {
    console.log(">>> Initialize users");
    return await Promise.all(
      users.map(async (user: BasicUser) => {
        const newUser: InitUserRequestBody = {
          id: user.id,
          group: {
            // schoolId: [user.workingGroupId],
            "add-group1": [user.workingGroupId],
          },
          workingGroup: {
            // schoolId: user.workingGroupId,
            "add-group1": user.workingGroupId,
          },
        };
        try {
          const response = await this.postUser(newUser);
          console.log("Response:");
          console.log(response?.data);
        } catch (error) {
          console.log(error);
        }
      })
    );
  }

  public async executeSpec(details: SpecDetails): Promise<SpecResultsSummary> {
    console.log(`>>> Execute test for: ${details.id}`);

    // start the summary details
    let summary: SpecResultsSummary = {
      id: details.id,
      description: details.description,
      assignResponseSummary: [],
    };

    let specExperiment: ExperimentRequestResponseBody | undefined = undefined;

    // 1. create experiment
    specExperiment = await this.doCreateExperiment(details);

    if (!specExperiment) {
      console.log(">>> spec experiment failed to get created, bail out");
      summary.description = "something went wrong creating the experiment!";
      return summary;
    }

    // 2. Mark the user to test "excludeIfReached" against
    await this.doMarkUser(details);

    // 3. start enrolling
    await this.doStartEnrollment(specExperiment);

    // 4. assign all users and log responses
    await this.doAssignAllUsers(summary, details);

    // 5. delete the experiment
    await this.doDeleteExperiment(specExperiment);

    // 6. analyze the results
    summary = this.analyzeResults(summary, details);

    return summary;
  }

  public getAssignedConditionForAllValue(
    assignmentSummary: AssignmentResponseSummary,
    details: SpecDetails
  ) {
    const isCorrectNumberOfAssignedDecisionPoints =
      assignmentSummary.actualAssignedConditions.length ===
      details.experiment.decisionPoints.length;

    if (!isCorrectNumberOfAssignedDecisionPoints) {
      throw new Error(
        `Unexpected mismatch in actual assignments length (${assignmentSummary.actualAssignedConditions.length}) vs expected (${details.experiment.decisionPoints.length})`
      );
    }

    const parentConditionAliasMap = details.options?.useParentConditionAliasMap;

    const hasSameConditionForAll =
      assignmentSummary.actualAssignedConditions.every(
        (actualAssignedCondition: ActualAssignedCondition) => {
          if (parentConditionAliasMap) {
            return (
              parentConditionAliasMap[actualAssignedCondition.condition] ===
              parentConditionAliasMap[
                assignmentSummary.actualAssignedConditions[0].condition
              ]
            );
          } else {
            return (
              actualAssignedCondition.condition ===
              assignmentSummary.actualAssignedConditions[0].condition
            );
          }
        }
      );

    if (parentConditionAliasMap) {
      assignmentSummary.assignedConditionForAll = hasSameConditionForAll
        ? parentConditionAliasMap[
            assignmentSummary.actualAssignedConditions[0].condition
          ]
        : "mixed";
    } else {
      assignmentSummary.assignedConditionForAll = hasSameConditionForAll
        ? assignmentSummary.actualAssignedConditions[0].condition
        : "mixed";
    }
  }

  public getConditionAnalysisResult(
    assignmentSummary: AssignmentResponseSummary,
    details: SpecDetails,
    summary: SpecResultsSummary
  ) {
    const result: SpecResult = {
      conditionPasses: false,
      userMatchPasses: false,
      overall: SpecOverallPassFail.FAIL,
    };

    const isDefaultMatch =
      assignmentSummary.assignedConditionForAll === ConditionCode.DEFAULT &&
      assignmentSummary.expected.conditionShouldBe ===
        ConditionAssertion.DEFAULT;

    const isControlOrVariantMatch =
      assignmentSummary.assignedConditionForAll !== ConditionCode.DEFAULT &&
      assignmentSummary.expected.conditionShouldBe ===
        (details?.options?.useCustomAssertion ||
          ConditionAssertion.CONTROL_OR_VARIANT);

    const isConditionMatchWithUserInGroup =
      this.findIsConditionMatchWithUserInGroup(summary, assignmentSummary);

    if (isDefaultMatch || isControlOrVariantMatch) {
      result.conditionPasses = true;
    }

    result.userMatchPasses = isConditionMatchWithUserInGroup;

    if (result.userMatchPasses && result.conditionPasses) {
      result.overall = SpecOverallPassFail.PASS;
    }

    assignmentSummary.result = result;
  }

  public analyzeResults(
    summary: SpecResultsSummary,
    details: SpecDetails
  ): SpecResultsSummary {
    // first loop over each user summary to assign the "AssignedConditionForAll" value for each user
    summary.assignResponseSummary.forEach(
      (assignSummary: AssignmentResponseSummary) => {
        this.getAssignedConditionForAllValue(assignSummary, details);
      }
    );

    // then loop over again to analyze pass/fail
    summary.assignResponseSummary.forEach(
      (assignSummary: AssignmentResponseSummary) => {
        this.getConditionAnalysisResult(assignSummary, details, summary);
      }
    );

    return summary;
  }

  public findIsConditionMatchWithUserInGroup(
    summary: SpecResultsSummary,
    thisUserSummary: AssignmentResponseSummary
  ): boolean {
    if (thisUserSummary.expected.conditionShouldMatchUser === null) {
      return true;
    }

    const userToMatch = summary.assignResponseSummary.find(
      (summary: AssignmentResponseSummary) => {
        return (
          summary.userId === thisUserSummary.expected.conditionShouldMatchUser
        );
      }
    );

    return !!(
      userToMatch?.assignedConditionForAll ===
      thisUserSummary.assignedConditionForAll
    );
  }

  public async doCreateExperiment(
    details: SpecDetails
  ): Promise<ExperimentRequestResponseBody | undefined> {
    const experimentRequestBody = this.createNewExperiment(details);

    try {
      const response = await this.postExperiment(experimentRequestBody);
      console.log(">>> Experiment successfully created:");
      // console.log(JSON.stringify(response?.data, null, 2));
      return response?.data;
    } catch (error) {
      console.log(error);
    }
  }

  public async doMarkUser(details: SpecDetails) {
    const markRequestBody: MarkRequestBody = {
      userId: "ABE",
      experimentPoint: "SelectSection",
      partitionId: `${details.id}${details.experiment.decisionPoints[0].targetSuffix}`,
      condition: "control",
    };

    try {
      const response = await this.postMark(markRequestBody);
      const markedResponse = response?.data;
      console.log(">>> Abe successfully marked:");
      // console.log(markRequestBody);
      // console.log(markedResponse);
    } catch (error) {
      console.log(error);
    }
  }

  public async doStartEnrollment(experiment: ExperimentRequestResponseBody) {
    if (experiment?.id) {
      const statusRequestBody: StatusRequestBody = {
        experimentId: experiment.id,
        state: "enrolling",
      };

      try {
        const response = await this.postStatusUpdate(statusRequestBody);
        const statusResponse = response?.data;
        console.log(">>> Experiment successfully started enrolling:");
        // console.log(statusResponse);
      } catch (error) {
        console.log(error);
      }
    }
  }

  public async doAssignAllUsers(
    summary: SpecResultsSummary,
    details: SpecDetails
  ) {
    await Promise.all(
      excludeIfReachedUsers.map(async (user: BasicUser) => {
        const assignRequestBody: AssignRequestBody = {
          userId: user.id,
          context: this.context,
        };

        try {
          const response = await this.assignUser(assignRequestBody);
          // log this for summary
          const assignResponse = response?.data;
          console.log(
            `>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ${user.id} successfully assigned:`
          );
          // console.log(assignResponse);
          summary = this.updateSummary(
            assignResponse,
            summary,
            `${details.id}${details.experiment.decisionPoints[0].targetSuffix}`,
            user.id,
            details
          );
        } catch (error) {
          console.log(`${user.id} failed to assign`);
          // console.log(error);
        }
      })
    );
  }

  public updateSummary(
    assignResponse: AssignResponse[],
    summary: SpecResultsSummary,
    target: string,
    userId: UserNameType,
    details: SpecDetails
  ): SpecResultsSummary {
    let actualAssignedConditions: ActualAssignedCondition[] = [];

    const specExperimentAssignments = assignResponse.filter(
      (assignResponse: AssignResponse) => {
        return assignResponse.expId.startsWith(details.id);
      }
    );

    if (!specExperimentAssignments.length) {
      actualAssignedConditions = details.experiment.decisionPoints.map(
        (decisionPoint: MockDecisionPoint) => {
          return {
            decisionPointTarget: details.id + decisionPoint.targetSuffix,
            condition: ConditionCode.DEFAULT,
          };
        }
      );
    } else {
      actualAssignedConditions = specExperimentAssignments.map(
        (assignResponse: AssignResponse) => {
          return {
            decisionPointTarget: assignResponse.expId,
            condition: assignResponse.assignedCondition.conditionCode,
          };
        }
      );
    }

    summary.assignResponseSummary.push({
      userId,
      assignedConditionForAll: "mixed",
      actualAssignedConditions,
      expected: details.assertions[userId],
    });

    return summary;
  }

  public async doDeleteExperiment(experiment: ExperimentRequestResponseBody) {
    if (experiment?.id) {
      try {
        const response = await this.deleteExperiment(experiment);
        const deleteResponse = response?.data;
        console.log(">>> Experiment successfully deleted:");
        // console.log(deleteResponse);
      } catch (error) {
        // console.log(error);
      }
    }
  }

  public async assignUser(data: AssignRequestBody) {
    console.log(`request: POST ${this.host}${env.endpoints.assign}`);
    // console.log("Body:");
    // console.log(data);
    return axios.post(`${this.host}${env.endpoints.assign}`, data, {
      headers: { Authorization: `Bearer ${this.authToken}` },
    });
  }

  public async deleteExperiment(data: ExperimentRequestResponseBody) {
    console.log(
      `request: DELETE ${this.host}${env.endpoints.experiment}/${data.id}`
    );
    // console.log("Body:");
    // console.log(data);
    return axios.delete(`${this.host}${env.endpoints.experiment}/${data.id}`, {
      headers: { Authorization: `Bearer ${this.authToken}` },
    });
  }

  public async postMark(data: MarkRequestBody) {
    console.log(`request: POST ${this.host}${env.endpoints.mark}`);
    // console.log("Body:");
    // console.log(data);
    return axios.post(`${this.host}${env.endpoints.mark}`, data, {
      headers: { Authorization: `Bearer ${this.authToken}` },
    });
  }

  public async postUser(data: InitUserRequestBody) {
    console.log(`request: POST ${this.host}${env.endpoints.init}`);
    // console.log("Body:");
    // console.log(data);
    return axios.post(`${this.host}${env.endpoints.init}`, data, {
      headers: { Authorization: `Bearer ${this.authToken}` },
    });
  }

  public async postExperiment(data: ExperimentRequestResponseBody) {
    console.log(`request: POST ${this.host}${env.endpoints.experiment}`);
    // console.log("Body:");
    // console.log(data);
    return axios.post(`${this.host}${env.endpoints.experiment}`, data, {
      headers: { Authorization: `Bearer ${this.authToken}` },
    });
  }

  public async postStatusUpdate(data: StatusRequestBody) {
    console.log(`request: POST ${this.host}${env.endpoints.status}`);
    // console.log("Body:");
    // console.log(data);
    return axios.post(`${this.host}${env.endpoints.status}`, data, {
      headers: { Authorization: `Bearer ${this.authToken}` },
    });
  }

  public generateDecisionPointsConditionsAndAliases(details: SpecDetails): any {
    const conditions = details.experiment.conditions.map(
      (condition: MockExperimentCondition, index: number) => {
        return {
          id: uuidv4(),
          conditionCode: condition.conditionCode,
          assignmentWeight: (
            100 / details.experiment.conditions.length
          ).toString(),
          description: "",
          order: index + 1,
          name: "",
        };
      }
    );

    const decisionPoints = details.experiment.decisionPoints.map(
      (decisionPoint: MockDecisionPoint, index: number) => {
        return {
          site: DecisionPointSite.SELECT_SECTION,
          target: `${details.id}${decisionPoint.targetSuffix}`,
          description: "",
          order: index + 1,
          excludeIfReached: decisionPoint.excludeIfReached,
        };
      }
    );

    const conditionAliases = details.experiment.conditionAliases
      ? details.experiment.conditionAliases.map(
          (conditionAlias: MockConditionAlias) => {
            const parentCondition = conditions.find((condition) => {
              return condition.conditionCode === conditionAlias.conditionCode;
            });

            const decisionPoint = decisionPoints.find((decisionPoint) => {
              return (
                decisionPoint.target ===
                details.id + conditionAlias.decisionPointTargetSuffix
              );
            });

            return {
              id: uuidv4(),
              aliasName: conditionAlias.aliasName,
              parentCondition: parentCondition?.id,
              decisionPoint: `${details.id}${conditionAlias.decisionPointTargetSuffix}_${decisionPoint?.site}`,
            };
          }
        )
      : [];

    return {
      conditionAliases,
      conditions,
      decisionPoints,
    };
  }

  public createNewExperiment(
    details: SpecDetails
  ): ExperimentRequestResponseBody {
    const { conditions, decisionPoints, conditionAliases } =
      this.generateDecisionPointsConditionsAndAliases(details);
    const newExperiment: ExperimentRequestResponseBody = {
      name: details.id,
      description: "",
      consistencyRule: details.experiment.consistencyRule,
      assignmentUnit: details.experiment.assignmentUnit,
      context: [this.context],
      tags: [],
      logging: false,
      conditions,
      partitions: decisionPoints,
      conditionAliases,
      experimentSegmentInclusion: {
        userIds: [],
        groups: [],
        subSegmentIds: [],
        type: "private",
      },
      experimentSegmentExclusion: {
        userIds: [],
        groups: [],
        subSegmentIds: [],
        type: "private",
      },
      filterMode: "includeAll",
      group: "add-group1",
      queries: [],
      endOn: null,
      enrollmentCompleteCondition: null,
      startOn: null,
      state: "inactive",
      postExperimentRule: "continue",
      revertTo: null,
    };

    console.log(">>> Created New Experiment");
    // console.log(newExperiment);

    return newExperiment;
  }
}
