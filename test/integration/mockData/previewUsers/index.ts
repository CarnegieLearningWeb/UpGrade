import { PreviewUser } from '../../../../src/api/models/PreviewUser';
export const previewUsers: Array<Partial<PreviewUser>> = [
  {
    id: 'studentPreview1',
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
    id: 'studentPreview2',
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
    id: 'studentPreview3',
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
    id: 'studentPreview4',
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
