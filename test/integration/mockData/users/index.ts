import { User } from '../../../../src/api/models/User';
export const multipleUsers: Array<Partial<User>> = [
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
