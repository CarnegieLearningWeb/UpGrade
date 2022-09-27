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
 */

excludeIfReachedSuite.run([
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
]);
