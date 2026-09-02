import { isCanonicalEntityId } from './common-page-error.model';

describe('isCanonicalEntityId', () => {
  it.each<[string, string, boolean]>([
    ['a lowercase v4 UUID', '2382605e-1dd0-43fa-bbfd-59e3a460efa6', true],
    ['a lowercase v1 UUID', '2382605e-1dd0-13fa-bbfd-59e3a460efa6', true],
    ['the nil UUID', '00000000-0000-0000-0000-000000000000', true],
    ['the max UUID', 'ffffffff-ffff-ffff-ffff-ffffffffffff', true],
    ['an uppercase UUID (the app only generates lowercase URLs)', '2382605E-1DD0-43FA-BBFD-59E3A460EFA6', false],
    ['a UUID with an invalid version nibble', '11111111-1111-0111-8111-111111111111', false],
    ['a UUID with an invalid variant nibble', '11111111-1111-4111-0111-111111111111', false],
    ['a UUID with a trailing character', '2382605e-1dd0-43fa-bbfd-59e3a460efa62', false],
    ['a non-UUID string', 'not-a-uuid', false],
    ['an empty string', '', false],
  ])('should treat %s as canonical: %s', (label, id, expected) => {
    expect(isCanonicalEntityId(id)).toBe(expected);
  });
});
