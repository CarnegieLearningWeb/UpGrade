import { ExperimentUser } from '../../../../src/api/models/ExperimentUser';
export const multipleUsers: Array<Partial<ExperimentUser>> = [
  {
    id: 'student1',
    group: {
      teacher: '1',
    },
  },
  {
    id: 'student2',
    group: {
      teacher: '1',
    },
  },
  {
    id: 'student3',
    group: {
      teacher: '2',
    },
  },
  {
    id: 'student4',
    group: {
      teacher: '2',
    },
  },
];
