// TODO delete this after x-prize competition

import AlternateCondition from '../patch/alternateConditions.json';
import { INewExperimentAssignment } from 'upgrade_types';

// organize json data here
const importedJsonArray: Array<{
  experimentPoint: string;
  condition: string;
  id: string;
  workspace: string;
  schoolId: string[];
}> = AlternateCondition;

export const assignAlternateCondition = (user: any): ((data: INewExperimentAssignment) => INewExperimentAssignment) => {
  // tslint:disable-next-line: no-string-literal
  const userSchoolIds: string[] = user?.group?.['schoolId'];
  return (data: INewExperimentAssignment): INewExperimentAssignment => {
    const matchedConditions = importedJsonArray.filter(
      (importedJson) =>
        importedJson.experimentPoint === data.site &&
        importedJson.id === data.target &&
        importedJson.condition === data.assignedCondition.conditionCode
    );
    if (matchedConditions) {
      // search for schoolId
      matchedConditions.forEach((expCondPair) =>{
        const schoolExist = userSchoolIds.some((userSchoolId) => {
          return expCondPair.schoolId.includes(userSchoolId);
        });
        // replace assigned condition
        if (schoolExist) {
          data.assignedCondition.conditionCode = expCondPair.workspace;
        }
      })

    }
    return data;
  };
};

export const replaceAlternateConditionWithValidCondition = (
  experimentPoint: string,
  experimentId: string,
  condition: string,
  userDoc: any
): string => {
  let newCondition = condition;
  const userSchoolIds: string[] = userDoc?.group?.['schoolId'];
  const findData = importedJsonArray.find(
    (importedJson) =>
      importedJson.experimentPoint === experimentPoint &&
      importedJson.id === experimentId &&
      importedJson.workspace === condition
  );

  if (findData) {
    // search for schoolId
    const schoolExist = userSchoolIds.some((userSchoolId) => {
      return findData.schoolId.includes(userSchoolId);
    });

    if (schoolExist) {
      newCondition = findData.condition;
    }
  }

  return newCondition;
};
