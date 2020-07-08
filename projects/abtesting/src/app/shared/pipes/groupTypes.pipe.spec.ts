import { GroupTypePlural } from './groupTypes.pipe';
import { GroupTypes } from '../../core/experiments/store/experiments.model';

describe('GroupTypePluralPipe', () => {
  const groupTypePipe = new GroupTypePlural();

  it('should return classes', () => {
    expect(groupTypePipe.transform(GroupTypes.CLASS)).toBe('classes');
  });

  it('should return class', () => {
    expect(groupTypePipe.transform(GroupTypes.CLASS, 1)).toBe('class');
  });

  it('should return districts', () => {
    expect(groupTypePipe.transform(GroupTypes.DISTRICT)).toBe('districts');
  });

  it('should return district', () => {
    expect(groupTypePipe.transform(GroupTypes.DISTRICT, 1)).toBe('district');
  });

  it('should return schools', () => {
    expect(groupTypePipe.transform(GroupTypes.SCHOOL)).toBe('schools');
  });

  it('should return school', () => {
    expect(groupTypePipe.transform(GroupTypes.SCHOOL, 1)).toBe('school');
  });

  it('should return teacher', () => {
    expect(groupTypePipe.transform('teacher')).toBe('teacher');
  });

  it('should return teacher when 1 group is given', () => {
    expect(groupTypePipe.transform('teacher', 1)).toBe('teacher');
  });

});
