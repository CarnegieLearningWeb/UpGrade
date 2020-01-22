export interface IEnrollmentCompleteCondition {
  userCount: number;
  groupCount: number;
}

export interface IExperimentEnrollmentStats {
  id: string;
  users: number;
  group?: number;
  userExcluded: number;
  groupExcluded?: number;
  conditions: [
    {
      conditionId: string;
      users: number;
      groups: number;
    }
  ];
  segments: [
    {
      id: string;
      user: number;
      group?: number;
      conditions: [
        {
          id: string;
          user: number;
          group?: number;
        }
      ];
    }
  ];
}
