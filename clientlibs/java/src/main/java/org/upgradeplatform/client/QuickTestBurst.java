package org.upgradeplatform.client;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicInteger;

import org.eclipse.jdt.annotation.NonNull;
import org.upgradeplatform.interfaces.ResponseCallback;
import org.upgradeplatform.responsebeans.Condition;
import org.upgradeplatform.responsebeans.ErrorResponse;
import org.upgradeplatform.responsebeans.ExperimentUserResponse;
import org.upgradeplatform.responsebeans.ExperimentsResponse;
import org.upgradeplatform.responsebeans.InitializeUserResponse;
import org.upgradeplatform.responsebeans.MarkDecisionPoint;
import org.upgradeplatform.responsebeans.UserAliasResponse;
import org.upgradeplatform.utils.Utils.MarkedDecisionPointStatus;

/**
 * Reproduces the production burst pattern: one initialized user with N aliases, then an /assign followed by a
 * /mark for every alias, with a bounded number of alias pairs in flight at once.
 *
 * Each alias gets its own ExperimentClient, so every request carries that alias as its User-Id, the same as
 * production. Each /mark marks the decision point at (alias index mod number of returned decision points), so
 * different aliases mark different targets.
 *
 * With {@code --loops}, it sends that many bursts one after another, each from a fresh user whose alias count is
 * picked at random between {@code --minBurst} and {@code --maxBurst}, waiting a random {@code --minBurstWait} to
 * {@code --maxBurstWait} ms after each burst finishes before the next one's setup. Setup (init, working group,
 * aliases) is not counted in any timing. Bursts never overlap. The sizes and waits come from {@code --seed}
 * (printed on every run), so a run can be repeated exactly, e.g. to compare two backend builds.
 *
 * Pairs are streamed: a new pair starts only when one of the {@code --concurrency} slots frees up, and nothing is
 * kept per pair once it finishes except its latency samples, so memory stays flat however many loops run.
 *
 * <pre>
 * mvn exec:java -Dexec.mainClass="org.upgradeplatform.client.QuickTestBurst" -Dexec.args="185"
 * mvn exec:java -Dexec.mainClass="org.upgradeplatform.client.QuickTestBurst" \
 *   -Dexec.args="185 --concurrency 50 --env qa --context assign-prog"
 * mvn exec:java -Dexec.mainClass="org.upgradeplatform.client.QuickTestBurst" \
 *   -Dexec.args="--loops 50 --minBurst 10 --maxBurst 180 --minBurstWait 100 --maxBurstWait 1000 --seed 42"
 * </pre>
 *
 * Options (give either {@code <count>} or both {@code --minBurst} and {@code --maxBurst}):
 * <ul>
 * <li>{@code <count>} number of alias assign/mark pairs per burst (first argument; same as
 * {@code --minBurst <count> --maxBurst <count>})</li>
 * <li>{@code --loops N} number of bursts (default 1)</li>
 * <li>{@code --minBurst N --maxBurst N} alias pairs per burst, picked at random in this range (inclusive)</li>
 * <li>{@code --minBurstWait MS --maxBurstWait MS} wait after each burst, picked at random in this range
 * (inclusive; default 0)</li>
 * <li>{@code --seed N} seed for the burst sizes and waits (default: random, printed so it can be reused)</li>
 * <li>{@code --concurrency N} pairs in flight at once (default 50)</li>
 * <li>{@code --env local|qa|staging} (default local; qa and staging read UPGRADE_QA_URL / UPGRADE_STAGING_URL, see
 * QuickTestHosts), or {@code --url <base url>}</li>
 * <li>{@code --context <app context>} (default assign-prog)</li>
 * <li>{@code --user <id>} use an already-initialized user for every burst instead of creating one per burst</li>
 * <li>{@code --group-type <type> --group-id <id>} group and working group for a new user (default schoolId /
 * test_class_group)</li>
 * <li>{@code --token <auth token>} (default BearerToken, as QuickTest)</li>
 * <li>{@code --verbose} print every call</li>
 * </ul>
 */
public class QuickTestBurst {
    private static final MarkedDecisionPointStatus STATUS = MarkedDecisionPointStatus.CONDITION_APPLIED;

    private static int loops = 1;
    private static int minBurst = 0;
    private static int maxBurst = 0;
    private static int minBurstWait = 0;
    private static int maxBurstWait = 0;
    private static long seed = new Random().nextLong();
    private static int concurrency = 50;
    private static String hostUrl = QuickTestHosts.LOCAL_URL;
    private static String context = "assign-prog";
    private static String existingUserId = null;
    private static String groupType = "schoolId";
    private static String groupId = "test_class_group";
    private static String authToken = "BearerToken";
    private static boolean verbose = false;
    private static final String sessionId = "quicktest_burst_session_" + System.currentTimeMillis();

    /** Timings and failures, collected per burst and for the whole run. */
    private static final class Stats {
        final List<Long> assignMs = Collections.synchronizedList(new ArrayList<>());
        final List<Long> markMs = Collections.synchronizedList(new ArrayList<>());
        final List<Long> pairMs = Collections.synchronizedList(new ArrayList<>());
        final List<Long> burstMs = Collections.synchronizedList(new ArrayList<>());
        final List<String> errors = Collections.synchronizedList(new ArrayList<>());
        final AtomicInteger emptyAssignments = new AtomicInteger();

        void addAll(Stats other) {
            assignMs.addAll(other.assignMs);
            markMs.addAll(other.markMs);
            pairMs.addAll(other.pairMs);
            burstMs.addAll(other.burstMs);
            errors.addAll(other.errors);
            emptyAssignments.addAndGet(other.emptyAssignments.get());
        }
    }

    public static void main(String[] args) throws Exception {
        parseArgs(args);
        Random random = new Random(seed);
        String runId = "quicktest_burst_" + System.currentTimeMillis();

        System.out.printf("%d burst(s) of %s assign/mark pairs, %s ms between, %d in flight, context %s, host %s%n",
                loops, range(minBurst, maxBurst), range(minBurstWait, maxBurstWait), concurrency, context, hostUrl);
        System.out.println("client_session_id: " + sessionId);
        System.out.println("seed: " + seed);

        Stats total = new Stats();
        for (int loop = 1; loop <= loops; loop++) {
            int count = between(random, minBurst, maxBurst);
            int waitMs = between(random, minBurstWait, maxBurstWait);
            String userId = existingUserId != null ? existingUserId : runId + "_" + loop;

            Stats burst = runBurst(loop, userId, count);
            total.addAll(burst);
            printBurstLine(loop, count, burst);

            if (loop < loops && waitMs > 0) {
                Thread.sleep(waitMs);
            }
        }

        printSummary(total);
        System.exit(total.errors.isEmpty() ? 0 : 1);
    }

    /** One burst: set up the user and its aliases, then send every alias's assign/mark pair. */
    private static Stats runBurst(int loop, String userId, int count) throws InterruptedException {
        Stats stats = new Stats();
        List<String> aliases = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            aliases.add(userId + "_alias_" + (existingUserId != null ? loop + "_" : "") + i);
        }

        if (loops == 1) {
            System.out.println("Starting burst at " + Instant.now());
        }
        try {
            setUpUser(userId, aliases);
        } catch (RuntimeException e) {
            stats.errors.add("[burst " + loop + " setup] " + rootMessage(e));
            return stats;
        }

        Semaphore inFlight = new Semaphore(concurrency);
        AtomicInteger completed = new AtomicInteger();
        long burstStart = System.nanoTime();
        for (int i = 0; i < count; i++) {
            inFlight.acquire();
            try {
                runPair(i, aliases.get(i), count, stats, completed).whenComplete((v, e) -> inFlight.release());
            } catch (RuntimeException e) {
                // runPair failed before its future existed, so nothing else will give this slot back.
                inFlight.release();
                stats.errors.add("[" + i + "] " + rootMessage(e));
            }
        }
        // Every pair returns its slot when it finishes, so holding all of them means the burst is done.
        inFlight.acquire(concurrency);
        stats.burstMs.add(elapsedMs(burstStart));
        return stats;
    }

    /** Setup, like production: the user is initialized and has its groups and aliases set before the burst. */
    private static void setUpUser(String userId, List<String> aliases) {
        try (ExperimentClient userClient = new ExperimentClient(userId, context, authToken, sessionId, hostUrl,
                Collections.emptyMap())) {
            Map<String, String> workingGroup = new HashMap<>();
            workingGroup.put(groupType, groupId);
            if (existingUserId == null) {
                Map<String, List<String>> group = new HashMap<>();
                group.put(groupType, Collections.singletonList(groupId));
                call("init", (ResponseCallback<InitializeUserResponse> cb) -> userClient.init(group, workingGroup, cb))
                        .join();
                if (verbose || loops == 1) {
                    System.out.printf("Initialized user %s (%s=%s)%n", userId, groupType, groupId);
                }
            } else if (verbose || loops == 1) {
                System.out.printf("Using existing user %s%n", userId);
            }
            call("workinggroup", (ResponseCallback<ExperimentUserResponse> cb) -> userClient
                    .setWorkingGroup(workingGroup, cb)).join();
            call("useraliases", (ResponseCallback<UserAliasResponse> cb) -> userClient.setAltUserIds(aliases, cb))
                    .join();
            if (verbose || loops == 1) {
                System.out.printf("Set %d aliases%n", aliases.size());
            }
        }
    }

    /** One alias: /assign, then /mark on one of the decision points it was assigned. */
    private static CompletableFuture<Void> runPair(int index, String alias, int count, Stats stats,
            AtomicInteger completed) {
        ExperimentClient client = new ExperimentClient(alias, context, authToken, sessionId, hostUrl,
                Collections.emptyMap());
        long pairStart = System.nanoTime();
        long assignStart = System.nanoTime();

        return call("assign", (ResponseCallback<List<ExperimentsResponse>> cb) -> client
                .getAllExperimentConditions(true, cb))
                .thenCompose(assignments -> {
                    long ms = elapsedMs(assignStart);
                    stats.assignMs.add(ms);
                    if (verbose) {
                        System.out.printf("[%d] assign %d ms, %d decision points%n", index, ms, assignments.size());
                    }

                    String site;
                    String target;
                    String conditionCode;
                    if (assignments.isEmpty()) {
                        stats.emptyAssignments.incrementAndGet();
                        site = "SelectSection";
                        target = "quicktest_burst_target_" + index;
                        conditionCode = null;
                    } else {
                        ExperimentsResponse dp = assignments.get(index % assignments.size());
                        Condition[] conditions = dp.getAssignedCondition();
                        site = dp.getSite();
                        target = dp.getTarget();
                        conditionCode = conditions != null && conditions.length > 0
                                ? conditions[0].getConditionCode()
                                : null;
                    }

                    long markStart = System.nanoTime();
                    return call("mark", (ResponseCallback<MarkDecisionPoint> cb) -> client.markDecisionPoint(site,
                            target, conditionCode, STATUS, cb))
                            .thenAccept(r -> {
                                long markTook = elapsedMs(markStart);
                                stats.markMs.add(markTook);
                                if (verbose) {
                                    System.out.printf("[%d] mark %s/%s %d ms%n", index, site, target, markTook);
                                }
                            });
                })
                .handle((v, e) -> {
                    if (e != null) {
                        stats.errors.add("[" + index + "] " + rootMessage(e));
                    } else {
                        stats.pairMs.add(elapsedMs(pairStart));
                    }
                    // Close on another thread: this callback runs on the client's own Jersey async executor, and
                    // closing the client from that thread blocks ~5s (it waits for its own executor to shut down),
                    // which held each concurrency slot for 5s and made every burst take ~5s per wave.
                    CompletableFuture.runAsync(client::close);
                    int done = completed.incrementAndGet();
                    // Progress lines only for a single burst; with loops, each burst gets one summary line instead.
                    if (loops == 1 && !verbose && (done % Math.max(1, count / 10) == 0 || done == count)) {
                        System.out.printf("  %d/%d pairs done%n", done, count);
                    }
                    return null;
                });
    }

    /** Adapts the client's callback style to a CompletableFuture. */
    private static <T> CompletableFuture<T> call(String name, java.util.function.Consumer<ResponseCallback<T>> request) {
        CompletableFuture<T> future = new CompletableFuture<>();
        request.accept(new ResponseCallback<T>() {
            @Override
            public void onSuccess(@NonNull T response) {
                future.complete(response);
            }

            @Override
            public void onError(@NonNull ErrorResponse error) {
                future.completeExceptionally(new RuntimeException(name + " failed: " + error));
            }
        });
        return future;
    }

    /** One line per burst when looping, timestamped so it can be lined up with the backend's perfdiag lines. */
    private static void printBurstLine(int loop, int count, Stats burst) {
        if (loops == 1) {
            return;
        }
        String took = burst.burstMs.isEmpty() ? "setup failed" : burst.burstMs.get(0) + " ms";
        String assign = "";
        if (!burst.assignMs.isEmpty()) {
            List<Long> sorted = sorted(burst.assignMs);
            assign = String.format("  assign p50=%d p95=%d max=%d ms", percentile(sorted, 50), percentile(sorted, 95),
                    sorted.get(sorted.size() - 1));
        }
        System.out.printf("%s  burst %d/%d: %d pairs, %s, %d failed%s%n", Instant.now(), loop, loops, count, took,
                burst.errors.size(), assign);
    }

    private static void printSummary(Stats total) {
        String bursts = loops == 1 ? "Burst" : loops + " bursts";
        String took = total.burstMs.size() == 1 ? " in " + total.burstMs.get(0) + " ms" : "";
        System.out.printf("%n%s finished%s: %d pairs ok, %d failed (client_session_id %s, seed %d)%n", bursts, took,
                total.pairMs.size(), total.errors.size(), sessionId, seed);
        if (total.emptyAssignments.get() > 0) {
            System.out.printf("%d aliases got no assignments; their /mark used a placeholder target%n",
                    total.emptyAssignments.get());
        }
        printLatency("assign", total.assignMs);
        printLatency("mark", total.markMs);
        printLatency("pair", total.pairMs);
        if (total.burstMs.size() > 1) {
            printLatency("burst", total.burstMs);
        }
        total.errors.stream().limit(10).forEach(e -> System.out.println("  error " + e));
        if (total.errors.size() > 10) {
            System.out.printf("  ... and %d more errors%n", total.errors.size() - 10);
        }
    }

    private static void printLatency(String name, List<Long> samples) {
        if (samples.isEmpty()) {
            return;
        }
        List<Long> sorted = sorted(samples);
        System.out.printf("  %-6s n=%d  p50=%d ms  p95=%d ms  p99=%d ms  max=%d ms%n", name, sorted.size(),
                percentile(sorted, 50), percentile(sorted, 95), percentile(sorted, 99), sorted.get(sorted.size() - 1));
    }

    private static List<Long> sorted(List<Long> samples) {
        List<Long> sorted;
        synchronized (samples) {
            sorted = new ArrayList<>(samples);
        }
        Collections.sort(sorted);
        return sorted;
    }

    private static long percentile(List<Long> sorted, int p) {
        int index = (int) Math.ceil(p / 100.0 * sorted.size()) - 1;
        return sorted.get(Math.max(0, Math.min(index, sorted.size() - 1)));
    }

    private static long elapsedMs(long startNanos) {
        return (System.nanoTime() - startNanos) / 1_000_000;
    }

    /** A random int in [min, max], inclusive. */
    private static int between(Random random, int min, int max) {
        return min + random.nextInt(max - min + 1);
    }

    private static String range(int min, int max) {
        return min == max ? String.valueOf(min) : min + "-" + max;
    }

    private static String rootMessage(Throwable e) {
        Throwable t = e;
        while (t.getCause() != null) {
            t = t.getCause();
        }
        return t.getMessage();
    }

    private static void parseArgs(String[] args) {
        int start = 0;
        if (args.length > 0 && !args[0].startsWith("--")) {
            int count = parseInt("<count>", args[0]);
            minBurst = count;
            maxBurst = count;
            start = 1;
        }
        for (int i = start; i < args.length; i++) {
            String flag = args[i];
            if (flag.equals("--verbose")) {
                verbose = true;
                continue;
            }
            if (i + 1 >= args.length) {
                usage("missing value for " + flag);
            }
            String value = args[++i];
            switch (flag) {
                case "--loops" -> loops = parseInt(flag, value);
                case "--minBurst" -> minBurst = parseInt(flag, value);
                case "--maxBurst" -> maxBurst = parseInt(flag, value);
                case "--minBurstWait" -> minBurstWait = parseInt(flag, value);
                case "--maxBurstWait" -> maxBurstWait = parseInt(flag, value);
                case "--seed" -> {
                    try {
                        seed = Long.parseLong(value);
                    } catch (NumberFormatException e) {
                        usage("--seed must be a number, got " + value);
                    }
                }
                case "--concurrency" -> concurrency = parseInt(flag, value);
                case "--env" -> {
                    try {
                        hostUrl = QuickTestHosts.forEnv(value);
                    } catch (IllegalArgumentException | IllegalStateException e) {
                        usage("--env " + value + ": " + e.getMessage());
                    }
                }
                case "--url" -> hostUrl = value;
                case "--context" -> context = value;
                case "--user" -> existingUserId = value;
                case "--group-type" -> groupType = value;
                case "--group-id" -> groupId = value;
                case "--token" -> authToken = value;
                default -> usage("unknown option " + flag);
            }
        }
        if (minBurst < 1 || maxBurst < 1) {
            usage("give <count>, or both --minBurst and --maxBurst, of at least 1");
        }
        if (maxBurst < minBurst || maxBurstWait < minBurstWait) {
            usage("--maxBurst / --maxBurstWait must be at least --minBurst / --minBurstWait");
        }
        if (loops < 1 || concurrency < 1 || minBurstWait < 0) {
            usage("--loops and --concurrency must be at least 1, and --minBurstWait at least 0");
        }
    }

    private static int parseInt(String name, String value) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            usage(name + " must be a number, got " + value);
            return 0;
        }
    }

    private static void usage(String problem) {
        System.err.println(problem);
        System.err.println("usage: QuickTestBurst [<count>] [--loops 1] [--minBurst N --maxBurst N]"
                + " [--minBurstWait 0 --maxBurstWait 0] [--seed N] [--concurrency 50]"
                + " [--env local|qa|staging | --url <url>] [--context assign-prog] [--user <existing user id>]"
                + " [--group-type schoolId] [--group-id test_class_group] [--token BearerToken] [--verbose]");
        System.exit(2);
    }
}
