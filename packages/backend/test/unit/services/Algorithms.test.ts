import { buildWithinSubjectOrderedConditions } from '../../../src/api/Algorithms';
import { Experiment } from '../../../src/api/models/Experiment';
import { ExperimentCondition } from '../../../src/api/models/ExperimentCondition';
import { FactorDTO } from '../../../src/api/DTO/FactorDTO';
import { CONDITION_ORDER, EXPERIMENT_TYPE } from 'upgrade_types';

/**
 * These guard two invariants that the removal of the per-request deep copy in
 * getCachedValidExperiments made load-bearing:
 *
 *  1. ORDER INDEPENDENCE — the assignment read path (`getValidExperiments`) does NOT
 *     `ORDER BY conditions.order`; only the admin path (`findOneExperiment`) does. So whatever
 *     sequence Postgres happens to return rows in is what this code receives. Output must depend on
 *     each condition's `order` field, never on its position in the incoming array.
 *
 *     This is not hypothetical: ORDERED_ROUND_ROBIN previously produced correct output only because
 *     `assignRandom` had sorted `experiment.conditions` IN PLACE earlier in the same request, and
 *     this function silently consumed that side effect. Removing the in-place sort broke it. Worse,
 *     `assignRandom` is skipped when a user is already enrolled, so the ordering a user got on their
 *     first request differed from later ones.
 *
 *  2. NON-MUTATION — `experiment.conditions` can be the array owned by the in-memory experiment
 *     cache, which hands the same reference to every request.
 */
describe('Algorithms: buildWithinSubjectOrderedConditions', () => {
  const USER_ID = 'user-123';

  const makeCondition = (conditionCode: string, order: number, levelId?: string): ExperimentCondition =>
    ({
      id: `condition-${conditionCode}`,
      conditionCode,
      order,
      assignmentWeight: 50,
      levelCombinationElements: levelId ? [{ level: { id: levelId } }] : [],
    } as unknown as ExperimentCondition);

  // Deliberately stored out of `order`, the way an unordered query can return them.
  const scrambled = (): ExperimentCondition[] => [
    makeCondition('C', 3, 'level-c'),
    makeCondition('A', 1, 'level-a'),
    makeCondition('B', 2, 'level-b'),
  ];

  const sorted = (): ExperimentCondition[] => [
    makeCondition('A', 1, 'level-a'),
    makeCondition('B', 2, 'level-b'),
    makeCondition('C', 3, 'level-c'),
  ];

  const makeExperiment = (
    conditions: ExperimentCondition[],
    conditionOrder: CONDITION_ORDER,
    type: EXPERIMENT_TYPE = EXPERIMENT_TYPE.SIMPLE
  ): Experiment =>
    ({
      id: 'experiment-1',
      type,
      conditionOrder,
      conditions,
    } as unknown as Experiment);

  const factors: FactorDTO[] = [
    {
      name: 'Color',
      order: 1,
      levels: [
        { id: 'level-a', name: 'Red', payload: { type: 'string', value: 'red' } },
        { id: 'level-b', name: 'Blue', payload: { type: 'string', value: 'blue' } },
        { id: 'level-c', name: 'Green', payload: { type: 'string', value: 'green' } },
      ],
    },
  ] as unknown as FactorDTO[];

  const CONDITION_ORDERS = [
    CONDITION_ORDER.ORDERED_ROUND_ROBIN,
    CONDITION_ORDER.RANDOM,
    CONDITION_ORDER.RANDOM_ROUND_ROBIN,
  ];

  describe.each(CONDITION_ORDERS)('with conditionOrder %s', (conditionOrder) => {
    it.each([0, 1, 2, 5])(
      'should produce identical output regardless of incoming condition order (enrollment count %i)',
      (repeatedEnrollmentLength) => {
        const fromScrambled = buildWithinSubjectOrderedConditions(
          makeExperiment(scrambled(), conditionOrder),
          factors,
          USER_ID,
          repeatedEnrollmentLength
        );
        const fromSorted = buildWithinSubjectOrderedConditions(
          makeExperiment(sorted(), conditionOrder),
          factors,
          USER_ID,
          repeatedEnrollmentLength
        );

        expect(fromScrambled.orderedConditions.map((condition) => condition.conditionCode)).toEqual(
          fromSorted.orderedConditions.map((condition) => condition.conditionCode)
        );
      }
    );

    it('should not mutate the experiment conditions it was handed', () => {
      const conditions = scrambled();
      const experiment = makeExperiment(conditions, conditionOrder);
      const snapshot = JSON.parse(JSON.stringify(experiment));

      buildWithinSubjectOrderedConditions(experiment, factors, USER_ID, 1);
      buildWithinSubjectOrderedConditions(experiment, factors, USER_ID, 1);

      expect(JSON.parse(JSON.stringify(experiment))).toEqual(snapshot);
      expect(experiment.conditions).toBe(conditions);
      expect(experiment.conditions.map((condition) => condition.conditionCode)).toEqual(['C', 'A', 'B']);
    });
  });

  describe('ORDERED_ROUND_ROBIN', () => {
    // The strongest statement of the bug CI caught: the rotation baseline is `order`, not array
    // position, so an unsorted input must still start at the order-1 condition.
    it('should start the rotation at the lowest-order condition, not the first array element', () => {
      const { orderedConditions } = buildWithinSubjectOrderedConditions(
        makeExperiment(scrambled(), CONDITION_ORDER.ORDERED_ROUND_ROBIN),
        factors,
        USER_ID,
        0
      );

      expect(orderedConditions.map((condition) => condition.conditionCode)).toEqual(['A', 'B', 'C']);
    });

    it('should advance the rotation by the repeated enrollment count', () => {
      const rotationFor = (repeatedEnrollmentLength: number) =>
        buildWithinSubjectOrderedConditions(
          makeExperiment(scrambled(), CONDITION_ORDER.ORDERED_ROUND_ROBIN),
          factors,
          USER_ID,
          repeatedEnrollmentLength
        ).orderedConditions.map((condition) => condition.conditionCode);

      expect(rotationFor(1)).toEqual(['B', 'C', 'A']);
      expect(rotationFor(2)).toEqual(['C', 'A', 'B']);
      // wraps back around
      expect(rotationFor(3)).toEqual(['A', 'B', 'C']);
    });
  });

  describe('factorial experiments', () => {
    it('should keep orderedFactors aligned with orderedConditions regardless of incoming order', () => {
      const fromScrambled = buildWithinSubjectOrderedConditions(
        makeExperiment(scrambled(), CONDITION_ORDER.ORDERED_ROUND_ROBIN, EXPERIMENT_TYPE.FACTORIAL),
        factors,
        USER_ID,
        0
      );

      expect(fromScrambled.orderedConditions.map((condition) => condition.conditionCode)).toEqual(['A', 'B', 'C']);
      // condition A carries level-a (Red), B carries level-b (Blue), C carries level-c (Green) — the
      // factor array must be permuted in lockstep with the conditions, not left in arrival order.
      expect(fromScrambled.orderedFactors.map((factor) => factor['Color'].level)).toEqual(['Red', 'Blue', 'Green']);
    });
  });

  describe('single-condition experiments', () => {
    it('should return the condition untouched without consulting conditionOrder', () => {
      const { orderedConditions } = buildWithinSubjectOrderedConditions(
        makeExperiment([makeCondition('solo', 1)], CONDITION_ORDER.RANDOM),
        factors,
        USER_ID,
        3
      );

      expect(orderedConditions.map((condition) => condition.conditionCode)).toEqual(['solo']);
    });
  });
});
