import axios from "axios";
import { env } from "./env";
import { v4 as uuidv4 } from "uuid";
import {
  ExcludeIfReachedSpecDetails,
  MockDecisionPoint,
  MockExperimentCondition,
  MockExperimentDetails,
  SpecDetails,
} from "./mocks/Experiments";
import { BasicUser, excludeIfReachedUsers } from "./mocks/Users";
import {
  AssignRequestBody,
  ExperimentRequestBody,
  InitUserRequestBody,
  MarkRequestBody,
  StatusRequestBody,
} from "./mocks/RequestBody";

export class ExcludeIfReachedTests {
  private host: string;
  private authToken: string;

  constructor(envHost: string) {
    this.host = envHost;
    this.authToken = env.authToken;
    console.log(">>> Initializing tests for this host", this.host);
    console.log(">>> Using this bearer token:", this.authToken);
  }

  public async run() {
    console.log(">>> Begin ExcludeIfReachedTests");
    // Perform global setup steps
    await this.initializeUsers(excludeIfReachedUsers);

    // Execute tests
    ExcludeIfReachedSpecDetails.forEach(async (details: SpecDetails) => {
      await this.executeSpec(details);
    });

    // Clean up after all finished
  }

  public async initializeUsers(users: BasicUser[]) {
    console.log(">>> Initialize users");
    return await Promise.all(
      users.map(async (user: BasicUser) => {
        const newUser: InitUserRequestBody = {
          id: user.id,
          group: {
            schoolId: [user.workingGroupId],
          },
          workingGroup: {
            schoolId: user.workingGroupId,
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

  public async executeSpec(details: SpecDetails) {
    console.log(`>>> Execute test for: ${details.id}`);
    let specExperiment: ExperimentRequestBody | undefined = undefined;

    // 1. create experiment

    specExperiment = await this.doCreateExperiment(details);

    if (!specExperiment) {
      console.log(">>> spec experiment failed to get created, bail out");
      return;
    }

    // 2. Mark the user to test "excludeIfReached" against

    await this.doMarkUser(details);

    // 3. start enrolling
    await this.doStartEnrollment(specExperiment);

    // 4. assign all users and log responses
    await this.doAssignAllUsers();

    // 5. delete the experiment
    await this.doDeleteExperiment(specExperiment);
  }

  public async doCreateExperiment(
    details: SpecDetails
  ): Promise<ExperimentRequestBody | undefined> {
    const experimentRequestBody = this.createNewExperiment(details.experiment);

    try {
      const response = await this.postExperiment(experimentRequestBody);
      console.log(">>> Experiment successfully created:");
      return response?.data;
      // console.log(experiment);
    } catch (error) {
      console.log(error);
      return;
    }
  }

  public async doMarkUser(details: SpecDetails) {
    const markRequestBody: MarkRequestBody = {
      userId: "ABE",
      experimentPoint: "SelectSection",
      partitionId: details.experiment.decisionPoints[0].target,
      condition: "control",
    };

    try {
      const response = await this.postMark(markRequestBody);
      const markedResponse = response?.data;
      console.log(">>> Abe successfully marked:");
      console.log(markRequestBody);
      // console.log(markedResponse);
    } catch (error) {
      console.log(error);
    }
  }

  public async doStartEnrollment(experiment: ExperimentRequestBody) {
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

  public async doAssignAllUsers() {
    await Promise.all(
      excludeIfReachedUsers.map(async (user: BasicUser) => {
        const assignRequestBody: AssignRequestBody = {
          userId: user.id,
          context: "test",
        };

        try {
          const response = await this.assignUser(assignRequestBody);
          // log this for summary
          const assignResponse = response?.data;
          console.log(`>>> ${user.id} successfully assigned:`);
          console.log(assignResponse);
        } catch (error) {
          console.log(`${user.id} failed to assign`);
          // console.log(error);
        }
      })
    );
  }

  public async doDeleteExperiment(experiment: ExperimentRequestBody) {
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

  public async deleteExperiment(data: ExperimentRequestBody) {
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

  public async postExperiment(data: ExperimentRequestBody) {
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

  public createNewExperiment(
    details: MockExperimentDetails
  ): ExperimentRequestBody {
    const newExperiment: ExperimentRequestBody = {
      name: details.id,
      description: "",
      consistencyRule: details.consistencyRule,
      assignmentUnit: details.assignmentUnit,
      context: ["test"],
      tags: [],
      logging: false,
      conditions: details.conditions.map(
        (condition: MockExperimentCondition, index: number) => {
          return {
            id: uuidv4(),
            conditionCode: condition.conditionCode,
            assignmentWeight: (100 / details.conditions.length).toString(),
            description: "",
            order: index + 1,
            name: "",
          };
        }
      ),
      partitions: details.decisionPoints.map(
        (decisionPoint: MockDecisionPoint, index: number) => {
          return {
            site: "SelectSection",
            target: `${decisionPoint.target}`,
            description: "",
            order: index + 1,
            excludeIfReached: decisionPoint.excludeIfReached,
          };
        }
      ),
      conditionAliases: [],
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
