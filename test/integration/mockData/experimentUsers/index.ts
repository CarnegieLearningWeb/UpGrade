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

export const experimentUsers: Array<Partial<ExperimentUser>> = [
  {
    id: 'student1',
    group: {
      teacher: ['1'],
      class: ['1'],
    },
    workingGroup: {
      teacher: '1',
      class: '1',
    },
  },
  {
    id: 'student2',
    group: {
      teacher: ['1'],
      class: ['1'],
    },
    workingGroup: {
      teacher: '1',
      class: '1',
    },
  },
  {
    id: 'student3',
    group: {
      teacher: ['2'],
      class: ['2'],
    },
    workingGroup: {
      teacher: '2',
      class: '2',
    },
  },
  {
    id: 'student4',
    group: {
      teacher: ['2'],
      class: ['2'],
    },
    workingGroup: {
      teacher: '2',
      class: '2',
    },
  },
];
