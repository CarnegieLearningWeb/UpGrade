import { Pipe, PipeTransform } from '@angular/core';
import { GroupTypes } from '../../core/experiments/store/experiments.model';

@Pipe({
  name: 'groupTypePlural'
})
export class GroupTypePlural implements PipeTransform {
  transform(groupType: GroupTypes | string, groupCount: number = 10): string {
    // Default value for groupCount is 10 so that we can get plural values
    switch (groupType) {
      case GroupTypes.CLASS:
        return groupCount > 1 ? 'classes' : 'class';
      case GroupTypes.DISTRICT:
        return groupCount > 1 ? 'districts' : 'district';
      case GroupTypes.SCHOOL:
        return groupCount > 1 ? 'schools' : 'school';
      default:
        return groupType;
    }
  }
}
