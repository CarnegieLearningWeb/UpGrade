import { User } from '../../../../src/api/models/User';
export const multipleUsers: Array<Partial<User>> = [
  {
    id: 'student 1',
    group: {
      teacher: '1',
    },
  },
  {
    id: 'student 2',
    group: {
      teacher: '1',
    },
  },
  {
    id: 'student 3',
    group: {
      teacher: '2',
    },
  },
  {
    id: 'student 4',
    group: {
      teacher: '2',
    },
  },
];
