export type SpecDetails = {
  id: string;
  experiment: MockExperimentDetails;
};

export type MockExperimentDetails = {
  id: string;
  assignmentUnit: "group" | "individual";
  consistencyRule: "group" | "individual" | "experiment";
  conditions: MockExperimentCondition[];
  decisionPoints: MockDecisionPoint[];
};

export type MockExperimentCondition = {
  conditionCode: string;
};

export type MockDecisionPoint = {
  site: string;
  target: string;
  excludeIfReached: boolean;
};

// export type SpecSummary = {

// }

export const ExcludeIfReachedSpecDetails: SpecDetails[] = [
  {
    id: "SINGLE_IND_IND",
    experiment: {
      id: "SINGLE_IND_IND",
      assignmentUnit: "individual",
      consistencyRule: "individual",
      conditions: [
        {
          conditionCode: "control",
        },
        {
          conditionCode: "variant",
        },
      ],
      decisionPoints: [
        {
          site: "SelectSections",
          target: "SINGLE_IND_IND_A",
          excludeIfReached: true,
        },
      ],
    },
  },
];
