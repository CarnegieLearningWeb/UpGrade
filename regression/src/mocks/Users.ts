export type BasicUser = {
  id: string;
  workingGroupId: string;
};

export const excludeIfReachedUsers: BasicUser[] = [
  {
    id: "ABE",
    workingGroupId: "1",
  },
  {
    id: "BORT",
    workingGroupId: "1",
  },
  {
    id: "CHAZ",
    workingGroupId: "2",
  },
  {
    id: "DALE",
    workingGroupId: "2",
  },
];
