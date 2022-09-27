/* eslint-disable prettier/prettier */
import { ExcludeIfReachedTests } from "./ExcludeIfReachedTests/ExcludeIfReachedTests";
import { env } from "./env";
import { ExcludeIfReachedTestNames } from "./ExcludeIfReachedTests/ExcludeIfReachedTestDetails";

const excludeIfReachedSuite = new ExcludeIfReachedTests(env.local, env.context);

/**
 * Exclude If Reached Tests
 * 
 * To run the entire suite, pass in empty array (or nothing at all)
 * 
 *     excludeIfReachedSuite.run() or excludeIfReachedSuite.run([])
 * 
 * Otherwise, supply a list of testnames
 * 
 *     excludeIfReachedSuite.run([
 *       ExcludeIfReachedTestNames.SINGLE_GRP_IND_TRUE,
 *       ExcludeIfReachedTestNames.SINGLE_IND_IND_TRUE
 *     ]);
 * 
 * Every test will execute as follows:
 * 
 * 1. (Before all) Users ABE, BORT, CHAZ, and DALE /init
 * 2. Scenario-specific Experiment created
 * 3. User ABE will /mark target A in the experiment
 * 4. Experiment will begin enrollment
 * 5. All users will /assign
 * 6. Experiment will be deleted
 * 7. Assigned conditions will be analyzed against assertions in spec
 * 8. (After all) Summaries published
 */

excludeIfReachedSuite.run([
  /* Single Decision Point, two condtions */

  ExcludeIfReachedTestNames.SINGLE_IND_IND_TRUE,
  ExcludeIfReachedTestNames.SINGLE_IND_IND_FALSE,
  ExcludeIfReachedTestNames.SINGLE_GRP_IND_TRUE,
  ExcludeIfReachedTestNames.SINGLE_GRP_IND_FALSE,
  ExcludeIfReachedTestNames.SINGLE_GRP_GRP_TRUE,
  ExcludeIfReachedTestNames.SINGLE_GRP_GRP_FALSE,
  ExcludeIfReachedTestNames.SINGLE_IND_EXP_TRUE,
  ExcludeIfReachedTestNames.SINGLE_IND_EXP_FALSE,
  ExcludeIfReachedTestNames.SINGLE_GRP_EXP_TRUE,
  ExcludeIfReachedTestNames.SINGLE_GRP_EXP_FALSE,

  /* Coordinated Decision Points, two decision points, two conditions */

  ExcludeIfReachedTestNames.IND_IND_TWO_DP_BOTH_TRUE,
  ExcludeIfReachedTestNames.IND_IND_TWO_DP_BOTH_FALSE,
  ExcludeIfReachedTestNames.IND_IND_TWO_DP_TARGETA_TRUE,
  ExcludeIfReachedTestNames.IND_IND_TWO_DP_TARGETB_TRUE,

  ExcludeIfReachedTestNames.GRP_IND_TWO_DP_BOTH_TRUE,
  ExcludeIfReachedTestNames.GRP_IND_TWO_DP_BOTH_FALSE,
  ExcludeIfReachedTestNames.GRP_IND_TWO_DP_TARGETA_TRUE,
  ExcludeIfReachedTestNames.GRP_IND_TWO_DP_TARGETB_TRUE,
]);
