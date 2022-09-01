import { ExperimentUser } from '../../../../src/api/models/ExperimentUser';

export const experimentUsers: Array<Partial<ExperimentUser>> = [
  {
    id: 'student1',
    group: {
      teacher: ['1'],
    },
    workingGroup: {
      teacher: '1',
    },
  },
  {
    id: 'student2',
    group: {
      teacher: ['1'],
    },
    workingGroup: {
      teacher: '1',
    },
  },
  {
    id: 'student3',
    group: {
      teacher: ['2'],
    },
    workingGroup: {
      teacher: '2',
    },
  },
  {
    id: 'student4',
    group: {
      teacher: ['2'],
    },
    workingGroup: {
      teacher: '2',
    },
  },
  {
    id: 'student5',
    group: {
      teacher: ['3'],
    },
    workingGroup: {
      teacher: '3',
    },
  },
  {
    id: 'student6',
    group: {
      teacher: ['3'],
    },
    workingGroup: {
      teacher: '3',
    },
  },
];
