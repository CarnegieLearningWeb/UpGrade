
---

ABE and BORT are in group 1
CHAZ and DALE are in group 2

Simulate Individual Assignment, Individual Consistency, Single Decision Point Experiment
(One DP, exclude_if_reached is true)

1. /mark ABE for "SINGLE_IND_IND"
2. Start experiment "SINGLE_IND_IND"
3. /assign ABE
4. /assign BORT
5. /assign CHAZ
6. /assign DALE

ABE should be excluded (keep getting default)
BORT should get assigned any condition
CHAZ should get assigned any condition
DALE should get assigned any condition

---

Simulate Group Assignment, Individual Consistency, Single Decison Point Experiment
(One DP, exclude_if_reached is true)

1. /mark ABE for "SINGLE_GRP_IND"
2. Start experiment for "SINGLE_GRP_IND"
3. /assign ABE
4. /assign BORT
5. /assign CHAZ
6. /assign DALE

ABE should be excluded (keep getting default)
BORT should get assigned any condition
CHAZ should get assigned any condition
DALE should get assigned same condition as CHAZ

---

Simulate Group Assignment, Group Consistency, Single Decison Point Experiment
(One DP, exclude_if_reached is true)

1. /mark ABE for "SINGLE_GRP_GRP"
2. Start experiment for "SINGLE_GRP_GRP"
3. /assign ABE
4. /assign BORT
5. /assign CHAZ
6. /assign DALE

ABE should be excluded (keep getting default)
BORT should get excluded (keep getting default)
CHAZ should get assigned any condition
DALE should get assigned same condition as CHAZ

---

Simulate Individual Assignment, Experiment Consistency, Single Decision Point Experiment
(One DP, exclude_if_reached is false)

1. /mark ABE for "SINGLE_IND_EXP"
2. Start experiment for "SINGLE_IND_EXP"
3. /assign ABE
4. /assign BORT
5. /assign CHAZ
6. /assign DALE

ABE should get any condition
BORT should get any condition
CHAZ should get any condition
DALE should get any condition

---

Simulate Individual Assignment, Experiment Consistency, Single Decision Point Experiment
(One DP, exclude_if_reached is false)

1. /mark ABE for "SINGLE_GRP_EXP"
2. Start experiment for "SINGLE_GRP_EXP"
3. /assign ABE
4. /assign BORT
5. /assign CHAZ
6. /assign DALE

ABE should get any condition
BORT should get same condition as ABE
CHAZ should get any condition
DALE should get same condition as CHAZ

---
---

Simulate Individual Assignment, Individual Consistency, Multi Decision Point Experiment
(Two DP, exclude_if_reached is true for both)

1. /mark ABE for "MULTI_IND_IND_A"
2. Start experiment for "MULTI_IND_IND"
3. /assign ABE
4. /assign BORT
5. /assign CHAZ
6. /assign DALE

ABE should get excluded (keep getting default)
BORT should get any condition, same for both DP
CHAZ should get any condition, same for both DP
DALE should get any condition, same for both DP

---

Simulate Group Assignment, Individual Consistency, Multi Decision Point Experiment
(Two DP, exclude_if_reached is true for both)

1. /mark ABE for "MULTI_GRP_IND_A"
2. Start experiment for "MULTI_GRP_IND"
3. /assign ABE
4. /assign BORT
5. /assign CHAZ
6. /assign DALE

ABE should get excluded (keep getting default)
BORT should get any condition, same for both DP
CHAZ should get any condition, same for both DP
DALE should get same conditions as CHAZ for both DP

---

Simulate Group Assignment, Group Consistency, Multi Decision Point Experiment
(Two DP, exclude_if_reached is true for both)

1. /mark ABE for "MULTI_GRP_GRP_A"
2. Start experiment for "MULTI_GRP_GRP"
3. /assign ABE
4. /assign BORT
5. /assign CHAZ
6. /assign DALE

ABE should get excluded (keep getting default)
BORT should get excluded (keep getting default)
CHAZ should get any condition, same for both DP
DALE should get same conditions as CHAZ for both DP

---

Simulate Individual Assignment, Experiment Consistency, Multi Decision Point Experiment
(Two DP, exclude_if_reached is false for both)

1. /mark ABE for "MULTI_IND_EXP_A"
2. Start experiment for "MULTI_IND_EXP"
3. /assign ABE
4. /assign BORT
5. /assign CHAZ
6. /assign DALE

ABE should get any condition, same for both DP
BORT should get any condition, same for both DP
CHAZ should get any condition, same for both DP
DALE should get any condition, same for both DP

---

Simulate Group Assignment, Experiment Consistency, Multi Decision Point Experiment
(Two DP, exclude_if_reached is false for both)

1. /mark ABE for "MULTI_GRP_EXP_A"
2. Start experiment for "MULTI_GRP_EXP"
3. /assign ABE
4. /assign BORT
5. /assign CHAZ
6. /assign DALE

ABE should get any condition, same for both DP
BORT should get any condition, same for both DP
CHAZ should get any condition, same for both DP
DALE should get any condition, same for both DP

---

Simulate Individual Assignment, Mixed Multi Decision Point Experiment (Experiment Consistency?)
(Two DP, MULTI_IND_MIXED_A is true, MULTI_IND_MIXED_B is false)

First test = student marks exclusionary DP

1. /mark ABE for "MULTI_IND_MIXED_A"
2. Start experiment for "MULTI_IND_MIXED_1"
3. /assign ABE
4. /assign BORT
5. /assign CHAZ
6. /assign DALE

ABE should get excluded (keep getting default)
BORT should get any condition, same for both DP
CHAZ should get any condition, same for both DP
DALE should get any condition, same for both DP

Second test = student marks non-exclusionary DP

1. /mark ABE for "MULTI_IND_MIXED_B"
2. Start experiment for "MULTI_IND_MIXED_2"
3. /assign ABE
4. /assign BORT
5. /assign CHAZ
6. /assign DALE

ABE should get any condition, same for both DP
BORT should get any condition, same for both DP
CHAZ should get any condition, same for both DP
DALE should get any condition, same for both DP

---

Simulate Group Assignment, Mixed Multi Decision Point Experiment (Experiment Consistency?)
(Two DP, MULTI_IND_MIXED_A is true, MULTI_IND_MIXED_B is false)

First test = student marks exclusionary DP

1. /mark ABE for "MULTI_GRP_MIXED_A"
2. Start experiment for "MULTI_GRP_MIXED_1"
3. /assign ABE
4. /assign BORT
5. /assign CHAZ
6. /assign DALE

ABE should get excluded (keep getting default)
BORT should get excluded (keep getting default)
CHAZ should get any condition, same for both DP
DALE should get same conditions as CHAZ

Second test = student marks non-exclusionary DP

1. /mark ABE for "MULTI_GRP_MIXED_B"
2. Start experiment for "MULTI_GRP_MIXED_2"
3. /assign ABE
4. /assign BORT
5. /assign CHAZ
6. /assign DALE

ABE should get any condition, same for both DP
BORT should get same conditions as ABE
CHAZ should get any condition, same for both DP
DALE should get same conditions as CHAZ

---