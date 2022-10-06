export type BasicUser = {
  id: UserNameType;
  workingGroupId: string;
};

export const UserName = {
  ABE: "ABE",
  BORT: "BORT",
  CHAZ: "CHAZ",
  DALE: "DALE",
};

export type UserNameType = "ABE" | "BORT" | "CHAZ" | "DALE";

export const Group = {
  GROUP_1: "1",
  GROUP_2: "2",
};

export const excludeIfReachedUsers: BasicUser[] = [
  {
    id: UserName.ABE as UserNameType,
    workingGroupId: Group.GROUP_1,
  },
  {
    id: UserName.BORT as UserNameType,
    workingGroupId: Group.GROUP_1,
  },
  {
    id: UserName.CHAZ as UserNameType,
    workingGroupId: Group.GROUP_2,
  },
  {
    id: UserName.DALE as UserNameType,
    workingGroupId: Group.GROUP_2,
  },
];
