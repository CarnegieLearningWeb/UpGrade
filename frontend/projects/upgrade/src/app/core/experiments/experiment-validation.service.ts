import { Injectable } from '@angular/core';
import { ExperimentPartition, ExperimentCondition } from './store/experiments.model';

@Injectable({
  providedIn: 'root'
})
export class ExperimentValidationService {

  constructor() { }

  isValidString(value: any) {
    return typeof value === 'string' && value.trim()
  }

  filterForUnchangedDesignData([previous, current ]): boolean {
    const prevSiteTargets: string[] = previous[0].map(dp => dp.site?.trim() + dp.target?.trim())
    const prevConditions: string[] = previous[1].map(c => c.conditionCode?.trim())
    const currentSiteTargets: string[] = current[0].map(dp => dp.site?.trim() + dp.target?.trim())
    const currentConditions: string[]  = current[1].map(c => c.conditionCode?.trim())

    const prev = prevSiteTargets.concat(prevConditions);
    const curr = currentSiteTargets.concat(currentConditions);

    const same = JSON.stringify(prev) === JSON.stringify(curr);

    return !same;
  }

  validDesignDataFilter(designData: [ExperimentPartition[], ExperimentCondition[]]) {
    const [ partitions, conditions ] = designData;

    if (!partitions.length || !conditions.length) {
      return false;
    }
    const hasValidDecisionPointStrings = partitions.every(({ site, target }) => {
      return this.isValidString(site) && this.isValidString(target)
    })
    const hasValidConditionStrings = conditions.every(({ conditionCode }) => {
      return this.isValidString(conditionCode)
    })
    return hasValidDecisionPointStrings && hasValidConditionStrings;
  }
}
