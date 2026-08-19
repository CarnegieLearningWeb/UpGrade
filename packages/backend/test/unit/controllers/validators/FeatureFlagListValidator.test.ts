import { validate } from 'class-validator';
import { FeatureFlagListImportValidator } from '../../../../src/api/controllers/validators/FeatureFlagImportValidator';
import { FeatureFlagListValidator } from '../../../../src/api/controllers/validators/FeatureFlagListValidator';

describe('feature flag list validators', () => {
  it.each([FeatureFlagListValidator, FeatureFlagListImportValidator])(
    '%p rejects non-string list types',
    async (Validator) => {
      const input = Object.assign(new Validator(), {
        id: crypto.randomUUID(),
        enabled: true,
        listType: 123,
      });

      const errors = await validate(input);

      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            property: 'listType',
            constraints: expect.objectContaining({ isString: expect.any(String) }),
          }),
        ])
      );
    }
  );
});
