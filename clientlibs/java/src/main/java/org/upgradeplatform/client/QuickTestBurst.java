package org.upgradeplatform.client;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import org.eclipse.jdt.annotation.NonNull;
import org.upgradeplatform.interfaces.ResponseCallback;
import org.upgradeplatform.requestbeans.MarkExperimentRequestData;
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
 * With {@code --ratePerSecond}, bursts overlap instead: a new user (setup, then its burst) starts every 1/rate
 * seconds on average, whether or not earlier users have finished, the way users arrive in production. {@code --loops}
 * is then the number of users started (e.g. 360 at 6/s is about a minute). Gaps between starts are random
 * (exponential, i.e. Poisson arrivals) and come from {@code --seed}, or exactly 1/rate with {@code --evenArrivals}.
 * The summary adds the arrival rate actually achieved and the peak users and pairs in flight at once.
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
 * mvn exec:java -Dexec.mainClass="org.upgradeplatform.client.QuickTestBurst" \
 *   -Dexec.args="--loops 360 --minBurst 1 --maxBurst 50 --ratePerSecond 6 --seed 42 --env qa"
 * mvn exec:java -Dexec.mainClass="org.upgradeplatform.client.QuickTestBurst" \
 *   -Dexec.args="--loops 360 --burstTiers 90:1,8:2-10,1:11-30,1:31-200 --ratePerSecond 6 --seed 42 --env qa"
 * mvn exec:java -Dexec.mainClass="org.upgradeplatform.client.QuickTestBurst" \
 *   -Dexec.args="185 --url https://some-host.example.com"
 * </pre>
 *
 * <b>{@code --env qa} and {@code --env staging} are not built in.</b> Their URLs come from environment variables you
 * set on your own machine, which you need to add to your shell profile (e.g. {@code ~/.zshrc}) once:
 *
 * <pre>
 * export UPGRADE_QA_URL=https://&lt;qa backend host&gt;
 * export UPGRADE_STAGING_URL=https://&lt;staging backend host&gt;
 * </pre>
 *
 * See QuickTestHosts for details. {@code --url} takes a base URL directly and needs no variables.
 *
 * QuickTestBurstUi is a local web page for the same options, if you'd rather fill in a form than write the command.
 *
 * Options (give {@code <count>}, both {@code --minBurst} and {@code --maxBurst}, or {@code --burstTiers}):
 * <ul>
 * <li>{@code <count>} number of alias assign/mark pairs per burst (first argument; same as
 * {@code --minBurst <count> --maxBurst <count>})</li>
 * <li>{@code --loops N} number of bursts (default 1)</li>
 * <li>{@code --minBurst N --maxBurst N} alias pairs per burst, picked at random in this range (inclusive)</li>
 * <li>{@code --burstMean N} pick burst sizes on an exponential curve instead of uniformly: {@code --minBurst} is the
 * most common size and each larger size is a little less likely than the one before, with the curve's steepness set
 * so sizes average N (above {@code --minBurst}, below the range's middle). The percentiles this gives are printed at
 * the start of the run.</li>
 * <li>{@code --burstTiers P:SIZE,P:LOW-HIGH,...} pick burst sizes by tier instead, e.g.
 * {@code 90:1,8:2-10,1:11-30,1:31-200}: 90% of bursts are 1 pair, 8% are 2-10, and so on, with every size inside a
 * tier equally likely. The percents must add up to 100 and the ranges must not overlap. Sets the size range itself, so
 * it replaces {@code <count>}, {@code --minBurst / --maxBurst} and {@code --burstMean}. The mean and percentiles this
 * gives are printed at the start of the run.</li>
 * <li>{@code --minBurstWait MS --maxBurstWait MS} wait after each burst, picked at random in this range
 * (inclusive; default 0)</li>
 * <li>{@code --seed N} seed for the burst sizes and waits (default: random, printed so it can be reused)</li>
 * <li>{@code --ratePerSecond N} start users at this average rate, overlapping, instead of one burst after another
 * (decimals allowed; can't be combined with {@code --minBurstWait / --maxBurstWait})</li>
 * <li>{@code --evenArrivals} with {@code --ratePerSecond}, start users exactly 1/rate seconds apart instead of at
 * random gaps</li>
 * <li>{@code --percentEnroll N} mark against the mock data instead: each alias (a coin flip from {@code --seed})
 * enrolls N% of the time, marking one of the expected targets (ws_site/ws_target_1..45, site/target_group_1,
 * test_site/test_target_1) that its /assign returned, with the condition /assign gave it. Every other alias marks
 * ws_site/ws_target_none with no condition. Other targets /assign returns are never marked. Without this flag, each
 * alias marks one of whatever decision points /assign returned.</li>
 * <li>{@code --concurrency N} pairs in flight at once, per burst (default 50)</li>
 * <li>{@code --env local|local:<port>|qa|staging} (default local, which is localhost:3030; {@code local:3031} uses
 * another port; qa and staging read UPGRADE_QA_URL / UPGRADE_STAGING_URL from your environment, see above), or
 * {@code --url <base url>} to give the URL directly</li>
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
    private static double ratePerSecond = 0;
    private static boolean evenArrivals = false;
    private static double burstMean = 0;
    private static String burstTiers = null;
    // Cumulative probability of each burst size from minBurst up; null means uniform. Set from --burstMean or
    // --burstTiers.
    private static double[] burstSizeCdf = null;
    // Null means marks work as before --percentEnroll existed (see markFromAssignments).
    private static Double percentEnroll = null;
    // The mock data's decision points an enrolling alias may mark, as decisionPointKey(site, target).
    private static final Set<String> ENROLL_DECISION_POINTS = enrollDecisionPoints();
    // Every non-enrolling alias marks this, with no condition. It isn't one of the mock data's targets, and being a
    // single fixed decision point it doesn't add a new monitored decision point for every alias.
    private static final String NULL_MARK_SITE = "ws_site";
    private static final String NULL_MARK_TARGET = "ws_target_none";
    // Across every user's burst, so overlapping bursts in --ratePerSecond mode show their combined load.
    private static final AtomicInteger pairsInFlight = new AtomicInteger();
    private static final AtomicInteger peakPairsInFlight = new AtomicInteger();
    private static final String sessionId = "quicktest_burst_session_" + System.currentTimeMillis();

    /** Timings and failures, collected per burst and for the whole run. */
    private static final class Stats {
        final List<Long> assignMs = Collections.synchronizedList(new ArrayList<>());
        final List<Long> markMs = Collections.synchronizedList(new ArrayList<>());
        final List<Long> pairMs = Collections.synchronizedList(new ArrayList<>());
        final List<Long> burstMs = Collections.synchronizedList(new ArrayList<>());
        final List<String> errors = Collections.synchronizedList(new ArrayList<>());
        final AtomicInteger emptyAssignments = new AtomicInteger();
        // --percentEnroll only: marks by kind, and enrolling aliases that fell back to a null mark.
        final AtomicInteger enrollMarks = new AtomicInteger();
        final AtomicInteger nullMarks = new AtomicInteger();
        final AtomicInteger enrollFallbacks = new AtomicInteger();

        void addAll(Stats other) {
            assignMs.addAll(other.assignMs);
            markMs.addAll(other.markMs);
            pairMs.addAll(other.pairMs);
            burstMs.addAll(other.burstMs);
            errors.addAll(other.errors);
            emptyAssignments.addAndGet(other.emptyAssignments.get());
            enrollMarks.addAndGet(other.enrollMarks.get());
            nullMarks.addAndGet(other.nullMarks.get());
            enrollFallbacks.addAndGet(other.enrollFallbacks.get());
        }
    }

    public static void main(String[] args) throws Exception {
        parseArgs(args);
        Random random = new Random(seed);
        String runId = "quicktest_burst_" + System.currentTimeMillis();

        if (ratePerSecond > 0) {
            System.out.printf(
                    "%d burst(s) of %s assign/mark pairs, starting %s users/s (%s arrivals), %d in flight per user,"
                            + " context %s, host %s%n",
                    loops, range(minBurst, maxBurst), ratePerSecond, evenArrivals ? "even" : "random", concurrency,
                    context, hostUrl);
        } else {
            System.out.printf("%d burst(s) of %s assign/mark pairs, %s ms between, %d in flight, context %s, host %s%n",
                    loops, range(minBurst, maxBurst), range(minBurstWait, maxBurstWait), concurrency, context, hostUrl);
        }
        System.out.println("client_session_id: " + sessionId);
        System.out.println("seed: " + seed);
        if (minBurst != maxBurst) {
            System.out.println(describeBurstSizes());
        }
        if (percentEnroll != null) {
            System.out.printf("marks: %s%% enroll on one of the %d expected targets /assign returns,"
                    + " the rest mark %s/%s with no condition%n", percentEnroll, ENROLL_DECISION_POINTS.size(),
                    NULL_MARK_SITE, NULL_MARK_TARGET);
        }

        Stats total = ratePerSecond > 0 ? runAtRate(random, runId) : runSequentially(random, runId);

        printSummary(total);
        System.exit(total.errors.isEmpty() ? 0 : 1);
    }

    /** Bursts one after another: the next user's setup starts only after the previous burst and its wait. */
    private static Stats runSequentially(Random random, String runId) throws InterruptedException {
        Stats total = new Stats();
        for (int loop = 1; loop <= loops; loop++) {
            int count = nextBurstSize(random);
            int waitMs = between(random, minBurstWait, maxBurstWait);
            String userId = existingUserId != null ? existingUserId : runId + "_" + loop;

            Stats burst = runBurst(loop, userId, count);
            total.addAll(burst);
            printBurstLine(loop, count, burst);

            if (loop < loops && waitMs > 0) {
                Thread.sleep(waitMs);
            }
        }
        return total;
    }

    /**
     * Bursts that overlap: a new user (setup, then its burst) starts every 1/ratePerSecond seconds on average,
     * whether or not earlier users have finished, the way users arrive in production. A slow server therefore
     * means more users in flight, not fewer users started. Each start is scheduled against the run's start time, so
     * one late start doesn't push every later one back.
     */
    private static Stats runAtRate(Random random, String runId) throws Exception {
        // Daemon threads, so an unexpected failure in one user ends the run instead of idle pool threads holding the
        // JVM open.
        ExecutorService users = Executors.newCachedThreadPool(task -> {
            Thread thread = new Thread(task);
            thread.setDaemon(true);
            return thread;
        });
        List<Future<Stats>> results = new ArrayList<>();
        AtomicInteger usersInFlight = new AtomicInteger();
        AtomicInteger peakUsersInFlight = new AtomicInteger();

        long runStart = System.nanoTime();
        double nextStartNanos = 0;
        long lastStart = runStart;
        for (int loop = 1; loop <= loops; loop++) {
            int count = nextBurstSize(random);
            if (loop > 1) {
                nextStartNanos += arrivalGapNanos(random);
            }
            long sleepNanos = runStart + (long) nextStartNanos - System.nanoTime();
            if (sleepNanos > 0) {
                TimeUnit.NANOSECONDS.sleep(sleepNanos);
            }
            lastStart = System.nanoTime();

            int user = loop;
            String userId = existingUserId != null ? existingUserId : runId + "_" + loop;
            results.add(users.submit(() -> {
                peakUsersInFlight.accumulateAndGet(usersInFlight.incrementAndGet(), Math::max);
                try {
                    Stats burst = runBurst(user, userId, count);
                    printBurstLine(user, count, burst);
                    return burst;
                } finally {
                    usersInFlight.decrementAndGet();
                }
            }));
        }
        double startedOverSeconds = (lastStart - runStart) / 1e9;

        Stats total = new Stats();
        for (Future<Stats> result : results) {
            total.addAll(result.get());
        }
        users.shutdown();

        String achieved = loops > 1 ? String.format("%.2f users/s", (loops - 1) / startedOverSeconds) : "n/a";
        System.out.printf("%n%d users started over %.1f s: %s (target %s), peak %d users and %d pairs in flight%n",
                loops, startedOverSeconds, achieved, ratePerSecond, peakUsersInFlight.get(), peakPairsInFlight.get());
        return total;
    }

    /** Time until the next user starts: exponential (Poisson arrivals), or exactly 1/rate with --evenArrivals. */
    private static double arrivalGapNanos(Random random) {
        double gapSeconds = evenArrivals ? 1 / ratePerSecond : -Math.log(1 - random.nextDouble()) / ratePerSecond;
        return gapSeconds * 1e9;
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
        List<CompletableFuture<Void>> closes = Collections.synchronizedList(new ArrayList<>());
        // Separate from the run's Random, so the burst sizes and waits a seed gives don't change, and drawn here in
        // alias order rather than as responses arrive, so each alias gets the same enroll/pick on every run.
        Random markRandom = new Random(seed ^ (loop * 0x9E3779B97F4A7C15L));
        long burstStart = System.nanoTime();
        for (int i = 0; i < count; i++) {
            boolean enroll = percentEnroll != null && markRandom.nextDouble() * 100 < percentEnroll;
            double pick = markRandom.nextDouble();
            inFlight.acquire();
            try {
                runPair(i, aliases.get(i), count, enroll, pick, stats, completed, closes)
                        .whenComplete((v, e) -> inFlight.release());
            } catch (RuntimeException e) {
                // runPair failed before its future existed, so nothing else will give this slot back.
                inFlight.release();
                stats.errors.add("[" + i + "] " + rootMessage(e));
            }
        }
        // Every pair returns its slot when it finishes, so holding all of them means the burst is done.
        inFlight.acquire(concurrency);
        stats.burstMs.add(elapsedMs(burstStart));
        // Not timed: wait for every client of this burst to close, so no sockets carry over into the next burst
        // and none are cut off by System.exit after the last one.
        synchronized (closes) {
            CompletableFuture.allOf(closes.toArray(new CompletableFuture[0])).join();
        }
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

    /**
     * Without --percentEnroll: mark one of the decision points /assign returned (spread across aliases by index),
     * with its assigned condition, or a placeholder target with no condition if /assign returned none.
     */
    private static MarkExperimentRequestData markFromAssignments(int index, List<ExperimentsResponse> assignments,
            Stats stats) {
        if (assignments.isEmpty()) {
            stats.emptyAssignments.incrementAndGet();
            return new MarkExperimentRequestData("SelectSection", "quicktest_burst_target_" + index,
                    new Condition(null, null));
        }
        ExperimentsResponse dp = assignments.get(index % assignments.size());
        Condition[] conditions = dp.getAssignedCondition();
        Condition markedCondition = conditions != null && conditions.length > 0
                ? new Condition(conditions[0].getConditionCode(), conditions[0].getExperimentId())
                : new Condition(null, null);
        return new MarkExperimentRequestData(dp.getSite(), dp.getTarget(), markedCondition);
    }

    /**
     * With --percentEnroll. A non-enrolling alias marks NULL_MARK_SITE/NULL_MARK_TARGET, which isn't in the mock
     * data, with no condition. An enrolling alias marks one of the ENROLL_DECISION_POINTS that /assign returned with a
     * condition, picked by {@code pick}, with that condition; if /assign returned none of them, it falls back to the
     * null mark.
     */
    private static MarkExperimentRequestData markEnrollOrNull(List<ExperimentsResponse> assignments, boolean enroll,
            double pick, Stats stats) {
        if (enroll) {
            List<ExperimentsResponse> enrollable = new ArrayList<>();
            for (ExperimentsResponse dp : assignments) {
                if (ENROLL_DECISION_POINTS.contains(decisionPointKey(dp.getSite(), dp.getTarget()))
                        && assignedCondition(dp) != null) {
                    enrollable.add(dp);
                }
            }
            if (!enrollable.isEmpty()) {
                // Sorted, so the same pick lands on the same decision point whatever order /assign listed them in.
                enrollable.sort(Comparator.comparing(dp -> decisionPointKey(dp.getSite(), dp.getTarget())));
                ExperimentsResponse dp = enrollable.get((int) (pick * enrollable.size()));
                Condition condition = assignedCondition(dp);
                stats.enrollMarks.incrementAndGet();
                return new MarkExperimentRequestData(dp.getSite(), dp.getTarget(),
                        new Condition(condition.getConditionCode(), condition.getExperimentId()));
            }
            stats.enrollFallbacks.incrementAndGet();
        }
        stats.nullMarks.incrementAndGet();
        return new MarkExperimentRequestData(NULL_MARK_SITE, NULL_MARK_TARGET, new Condition(null, null));
    }

    /** The decision point's assigned condition, or null if /assign gave it none. */
    private static Condition assignedCondition(ExperimentsResponse dp) {
        Condition[] conditions = dp.getAssignedCondition();
        return conditions != null && conditions.length > 0 && conditions[0].getConditionCode() != null
                ? conditions[0]
                : null;
    }

    private static String decisionPointKey(String site, String target) {
        // Lower-cased: the client matches site and target case-insensitively.
        return (site + "/" + target).toLowerCase(Locale.ROOT);
    }

    private static Set<String> enrollDecisionPoints() {
        Set<String> keys = new HashSet<>();
        for (int i = 1; i <= 45; i++) {
            keys.add(decisionPointKey("ws_site", "ws_target_" + i));
        }
        keys.add(decisionPointKey("site", "target_group_1"));
        keys.add(decisionPointKey("test_site", "test_target_1"));
        return Collections.unmodifiableSet(keys);
    }

    /** One alias: /assign, then /mark on one of the decision points it was assigned. */
    private static CompletableFuture<Void> runPair(int index, String alias, int count, boolean enroll, double pick,
            Stats stats, AtomicInteger completed, List<CompletableFuture<Void>> closes) {
        ExperimentClient client = new ExperimentClient(alias, context, authToken, sessionId, hostUrl,
                Collections.emptyMap());
        long pairStart = System.nanoTime();
        long assignStart = System.nanoTime();
        peakPairsInFlight.accumulateAndGet(pairsInFlight.incrementAndGet(), Math::max);

        return call("assign", (ResponseCallback<List<ExperimentsResponse>> cb) -> client
                .getAllExperimentConditions(true, cb))
                .thenCompose(assignments -> {
                    long ms = elapsedMs(assignStart);
                    stats.assignMs.add(ms);
                    if (verbose) {
                        System.out.printf("[%d] assign %d ms, %d decision points%n", index, ms, assignments.size());
                    }

                    MarkExperimentRequestData markData = percentEnroll == null
                            ? markFromAssignments(index, assignments, stats)
                            : markEnrollOrNull(assignments, enroll, pick, stats);
                    String site = markData.getSite();
                    String target = markData.getTarget();

                    long markStart = System.nanoTime();
                    return call("mark", (ResponseCallback<MarkDecisionPoint> cb) -> client.markDecisionPoint(STATUS,
                            markData, cb))
                            .thenAccept(r -> {
                                long markTook = elapsedMs(markStart);
                                stats.markMs.add(markTook);
                                if (verbose) {
                                    System.out.printf("[%d] mark %s/%s %d ms%n", index, site, target, markTook);
                                }
                            });
                })
                .handle((v, e) -> {
                    pairsInFlight.decrementAndGet();
                    if (e != null) {
                        stats.errors.add("[" + index + "] " + rootMessage(e));
                    } else {
                        stats.pairMs.add(elapsedMs(pairStart));
                    }
                    // Close on another thread: this callback runs on the client's own Jersey async executor, and
                    // closing the client from that thread blocks ~5s (it waits for its own executor to shut down),
                    // which held each concurrency slot for 5s. From any other thread, close() returns right away.
                    // runBurst waits for these before the next burst starts.
                    closes.add(CompletableFuture.runAsync(client::close));
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
        if (percentEnroll != null) {
            int marks = total.enrollMarks.get() + total.nullMarks.get();
            System.out.printf("marks: %d enroll, %d null (%.1f%% enrolled, target %s%%)%n", total.enrollMarks.get(),
                    total.nullMarks.get(), marks == 0 ? 0.0 : 100.0 * total.enrollMarks.get() / marks, percentEnroll);
            if (total.enrollFallbacks.get() > 0) {
                System.out.printf("%d enrolling aliases got none of the expected targets with a condition from"
                        + " /assign, so made the null mark instead%n", total.enrollFallbacks.get());
            }
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
            if (flag.equals("--evenArrivals")) {
                evenArrivals = true;
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
                case "--ratePerSecond" -> ratePerSecond = parseDouble(flag, value);
                case "--burstMean" -> burstMean = parseDouble(flag, value);
                case "--burstTiers" -> burstTiers = value;
                case "--percentEnroll" -> percentEnroll = parseDouble(flag, value);
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
        if (burstTiers != null) {
            if (minBurst != 0 || maxBurst != 0 || burstMean != 0) {
                usage("--burstTiers sets the burst sizes, so it can't be combined with <count>, --minBurst /"
                        + " --maxBurst or --burstMean");
            }
            burstSizeCdf = tieredCdf(burstTiers);
        }
        if (minBurst < 1 || maxBurst < 1) {
            usage("give <count>, both --minBurst and --maxBurst (of at least 1), or --burstTiers");
        }
        if (maxBurst < minBurst || maxBurstWait < minBurstWait) {
            usage("--maxBurst / --maxBurstWait must be at least --minBurst / --minBurstWait");
        }
        if (loops < 1 || concurrency < 1 || minBurstWait < 0) {
            usage("--loops and --concurrency must be at least 1, and --minBurstWait at least 0");
        }
        if (ratePerSecond < 0) {
            usage("--ratePerSecond must be more than 0");
        }
        if (ratePerSecond > 0 && maxBurstWait > 0) {
            usage("--ratePerSecond sets when each burst starts, so it can't be combined with"
                    + " --minBurstWait / --maxBurstWait");
        }
        if (evenArrivals && ratePerSecond == 0) {
            usage("--evenArrivals needs --ratePerSecond");
        }
        if (percentEnroll != null && (percentEnroll < 0 || percentEnroll > 100)) {
            usage("--percentEnroll must be from 0 to 100, got " + percentEnroll);
        }
        if (burstMean != 0) {
            double midpoint = (minBurst + maxBurst) / 2.0;
            if (!(burstMean > minBurst && burstMean < midpoint)) {
                usage(String.format("--burstMean must be above --minBurst (%d) and below the middle of the range (%s),"
                        + " where sizes would be uniform; got %s", minBurst, midpoint, burstMean));
            }
            burstSizeCdf = geometricCdfWithMean(maxBurst - minBurst + 1, burstMean - minBurst);
        }
    }

    /** Alias pairs in the next burst: uniform in [minBurst, maxBurst], or from --burstMean's or --burstTiers' table. */
    private static int nextBurstSize(Random random) {
        if (burstSizeCdf == null) {
            return between(random, minBurst, maxBurst);
        }
        return minBurst + sizeIndexAt(random.nextDouble());
    }

    /** The smallest size offset whose cumulative probability reaches {@code p}. */
    private static int sizeIndexAt(double p) {
        // Searching just below p, so a p that falls exactly on a tier boundary (e.g. 0.98 after a 90% and an 8% tier)
        // lands on that tier's last size, not the next tier's first, despite the cumulative sums' rounding.
        int i = Arrays.binarySearch(burstSizeCdf, p - 1e-9);
        return i >= 0 ? i : -i - 1;
    }

    /**
     * Cumulative probabilities for sizes minBurst..maxBurst from a --burstTiers spec such as
     * "90:1,8:2-10,1:11-30,1:31-200": each tier is a percent of bursts and a size or inclusive size range, and its
     * percent is spread evenly over its sizes. Sets minBurst and maxBurst to the smallest and largest size covered.
     * The percents must add up to 100 and the ranges must not overlap; sizes no tier covers never come up.
     */
    private static double[] tieredCdf(String spec) {
        List<int[]> ranges = new ArrayList<>();
        List<Double> percents = new ArrayList<>();
        double totalPercent = 0;
        for (String tier : spec.split(",")) {
            String[] parts = tier.trim().split(":");
            String[] bounds = parts.length == 2 ? parts[1].trim().split("-") : new String[0];
            if (bounds.length < 1 || bounds.length > 2) {
                usage("--burstTiers: each tier is <percent>:<size> or <percent>:<low>-<high>, got \"" + tier + "\"");
            }
            double percent = parseDouble("--burstTiers percent", parts[0].trim());
            int low = parseInt("--burstTiers size", bounds[0].trim());
            int high = bounds.length == 2 ? parseInt("--burstTiers size", bounds[1].trim()) : low;
            if (percent <= 0 || low < 1 || high < low) {
                usage("--burstTiers: each tier needs a percent above 0 and sizes of at least 1, low to high, got \""
                        + tier + "\"");
            }
            ranges.add(new int[] { low, high });
            percents.add(percent);
            totalPercent += percent;
        }
        if (Math.abs(totalPercent - 100) > 1e-6) {
            usage("--burstTiers percents must add up to 100, got " + totalPercent);
        }

        minBurst = ranges.stream().mapToInt(r -> r[0]).min().getAsInt();
        maxBurst = ranges.stream().mapToInt(r -> r[1]).max().getAsInt();
        double[] weights = new double[maxBurst - minBurst + 1];
        for (int t = 0; t < ranges.size(); t++) {
            int[] r = ranges.get(t);
            for (int size = r[0]; size <= r[1]; size++) {
                if (weights[size - minBurst] > 0) {
                    usage("--burstTiers ranges overlap at size " + size);
                }
                weights[size - minBurst] = percents.get(t) / (r[1] - r[0] + 1);
            }
        }

        double[] cdf = new double[weights.length];
        double cumulative = 0;
        for (int k = 0; k < weights.length; k++) {
            cumulative += weights[k];
            cdf[k] = cumulative / totalPercent;
        }
        // Exactly 1, so every random.nextDouble() (always below 1) lands inside the table despite rounding.
        cdf[cdf.length - 1] = 1.0;
        return cdf;
    }

    /**
     * Cumulative probabilities for offsets 0..sizes-1 from minBurst, each offset {@code ratio} times as likely as the
     * one before it (a geometric distribution, the whole-number form of an exponential curve, cut off at maxBurst).
     * The ratio is found by bisection so the mean offset comes out at {@code meanOffset}: the mean rises steadily
     * from 0 (ratio near 0, every burst minBurst) to the range's midpoint (ratio 1, uniform).
     */
    private static double[] geometricCdfWithMean(int sizes, double meanOffset) {
        double low = 0;
        double high = 1;
        double[] cdf = null;
        for (int i = 0; i < 100; i++) {
            double ratio = (low + high) / 2;
            cdf = geometricCdf(sizes, ratio);
            if (meanOffset(cdf) < meanOffset) {
                low = ratio;
            } else {
                high = ratio;
            }
        }
        return cdf;
    }

    private static double[] geometricCdf(int sizes, double ratio) {
        double[] cdf = new double[sizes];
        double weight = 1;
        double total = 0;
        for (int k = 0; k < sizes; k++) {
            total += weight;
            cdf[k] = total;
            weight *= ratio;
        }
        for (int k = 0; k < sizes; k++) {
            cdf[k] /= total;
        }
        // Exactly 1, so every random.nextDouble() (always below 1) lands inside the table despite rounding.
        cdf[sizes - 1] = 1.0;
        return cdf;
    }

    private static double meanOffset(double[] cdf) {
        double mean = 0;
        for (int k = 1; k < cdf.length; k++) {
            mean += k * (cdf[k] - cdf[k - 1]);
        }
        return mean;
    }

    private static String describeBurstSizes() {
        if (burstSizeCdf == null) {
            return "burst sizes: uniform " + range(minBurst, maxBurst);
        }
        String shape = burstTiers != null ? "tiers " + burstTiers : "exponential curve";
        return String.format("burst sizes: %s, %s: mean %.2f, p50=%d p90=%d p95=%d p99=%d p99.9=%d",
                range(minBurst, maxBurst), shape, minBurst + meanOffset(burstSizeCdf), minBurst + sizeIndexAt(0.50),
                minBurst + sizeIndexAt(0.90), minBurst + sizeIndexAt(0.95), minBurst + sizeIndexAt(0.99),
                minBurst + sizeIndexAt(0.999));
    }

    private static double parseDouble(String name, String value) {
        try {
            double parsed = Double.parseDouble(value);
            if (Double.isNaN(parsed) || Double.isInfinite(parsed)) {
                usage(name + " must be a number, got " + value);
            }
            return parsed;
        } catch (NumberFormatException e) {
            usage(name + " must be a number, got " + value);
            return 0;
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
                + " [--minBurstWait 0 --maxBurstWait 0 | --ratePerSecond N [--evenArrivals]] [--seed N]"
                + " [--burstMean N | --burstTiers 90:1,8:2-10,...] [--percentEnroll N] [--concurrency 50]"
                + " [--env local|local:<port>|qa|staging | --url <url>] [--context assign-prog]"
                + " [--user <existing user id>]"
                + " [--group-type schoolId] [--group-id test_class_group] [--token BearerToken] [--verbose]");
        System.exit(2);
    }
}
