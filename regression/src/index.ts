/* eslint-disable prettier/prettier */
import { ExcludeIfReachedTestSuite } from "./ExcludeIfReachedTests/ExcludeIfReachedTestSuite";
import { env } from "./env";
import { ExcludeIfReachedSpecDetails, ExcludeIfReachedTestNames } from "./ExcludeIfReachedTests/ExcludeIfReachedTestScenarios";
import { XPRIZE_TestNames, XPRIZE_TestScenarios } from "./XPRIZE/XPRIZE_TestScenarios";

const excludeIfReachedTestSuite = new ExcludeIfReachedTestSuite(
  env.local, 
  env.context.ADD, 
  {
    writeSimpleSummaryToFile: false,
    writeDetailedSummaryToFile: false,
    writePath: "./src/results/"
  }
);

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

excludeIfReachedTestSuite.run([ExcludeIfReachedSpecDetails, XPRIZE_TestScenarios],[
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

  ExcludeIfReachedTestNames.IND_IND_TWO_DP_BOTH_TRUE,
  ExcludeIfReachedTestNames.IND_IND_TWO_DP_BOTH_FALSE,
  ExcludeIfReachedTestNames.IND_IND_TWO_DP_TARGETA_TRUE,
  ExcludeIfReachedTestNames.IND_IND_TWO_DP_TARGETB_TRUE,

  ExcludeIfReachedTestNames.GRP_IND_TWO_DP_BOTH_TRUE,
  ExcludeIfReachedTestNames.GRP_IND_TWO_DP_BOTH_FALSE,
  ExcludeIfReachedTestNames.GRP_IND_TWO_DP_TARGETA_TRUE,
  ExcludeIfReachedTestNames.GRP_IND_TWO_DP_TARGETB_TRUE,

  ExcludeIfReachedTestNames.GRP_GRP_TWO_DP_BOTH_TRUE,
  ExcludeIfReachedTestNames.GRP_GRP_TWO_DP_BOTH_FALSE,
  ExcludeIfReachedTestNames.GRP_GRP_TWO_DP_TARGETA_TRUE,
  ExcludeIfReachedTestNames.GRP_GRP_TWO_DP_TARGETB_TRUE,

  ExcludeIfReachedTestNames.IND_EXP_TWO_DP_BOTH_TRUE,
  ExcludeIfReachedTestNames.IND_EXP_TWO_DP_BOTH_FALSE,
  ExcludeIfReachedTestNames.IND_EXP_TWO_DP_TARGETA_TRUE,
  ExcludeIfReachedTestNames.IND_EXP_TWO_DP_TARGETB_TRUE,

  ExcludeIfReachedTestNames.GRP_EXP_TWO_DP_BOTH_TRUE,
  ExcludeIfReachedTestNames.GRP_EXP_TWO_DP_BOTH_FALSE,
  ExcludeIfReachedTestNames.GRP_EXP_TWO_DP_TARGETA_TRUE,
  ExcludeIfReachedTestNames.GRP_EXP_TWO_DP_TARGETB_TRUE,

  XPRIZE_TestNames.XPRIZE_INDIAN_RIVER,
  XPRIZE_TestNames.XPRIZE_INDIAN_RIVER_NO_ALIASES
]);
