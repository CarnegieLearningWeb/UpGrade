package org.upgradeplatform.client;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
 * /mark for every alias, with a bounded number of alias pairs in flight at once (the production Java service
 * runs about 11 threads).
 *
 * Each alias gets its own ExperimentClient, so every request carries that alias as its User-Id, the same as
 * production. Each /mark marks the decision point at (alias index mod number of returned decision points), so
 * different aliases mark different targets.
 *
 * <pre>
 * mvn exec:java -Dexec.mainClass="org.upgradeplatform.client.QuickTestBurst" -Dexec.args="185"
 * mvn exec:java -Dexec.mainClass="org.upgradeplatform.client.QuickTestBurst" \
 *   -Dexec.args="185 --concurrency 11 --env qa --context assign-prog"
 * </pre>
 *
 * Options (all but the count are optional):
 * <ul>
 * <li>{@code <count>} number of alias assign/mark pairs (required, first argument)</li>
 * <li>{@code --concurrency N} pairs in flight at once (default 11)</li>
 * <li>{@code --env local|qa|staging} same hosts as QuickTest (default local), or {@code --url <base url>}</li>
 * <li>{@code --context <app context>} (default assign-prog)</li>
 * <li>{@code --user <id>} use an already-initialized user instead of creating one</li>
 * <li>{@code --group-type <type> --group-id <id>} group and working group for a new user (default schoolId /
 * test_class_group)</li>
 * <li>{@code --token <auth token>} (default BearerToken, as QuickTest)</li>
 * <li>{@code --verbose} print every call</li>
 * </ul>
 */
public class QuickTestBurst {
    private static final String LOCAL_URL = "http://localhost:3030";
    private static final String ECS_QA_URL = "https://apps.qa-cli.net/upgrade-service";
    private static final String ECS_STAGING_URL = "https://apps.qa-cli.com/upgrade-service";
    private static final MarkedDecisionPointStatus STATUS = MarkedDecisionPointStatus.CONDITION_APPLIED;

    private static int count;
    private static int concurrency = 11;
    private static String hostUrl = LOCAL_URL;
    private static String context = "assign-prog";
    private static String existingUserId = null;
    private static String groupType = "schoolId";
    private static String groupId = "test_class_group";
    private static String authToken = "BearerToken";
    private static boolean verbose = false;
    private static final String sessionId = "quicktest_burst_session_" + System.currentTimeMillis();

    private static final List<Long> assignMs = Collections.synchronizedList(new ArrayList<>());
    private static final List<Long> markMs = Collections.synchronizedList(new ArrayList<>());
    private static final List<Long> pairMs = Collections.synchronizedList(new ArrayList<>());
    private static final List<String> errors = Collections.synchronizedList(new ArrayList<>());
    private static final AtomicInteger emptyAssignments = new AtomicInteger();
    private static final AtomicInteger completed = new AtomicInteger();

    public static void main(String[] args) throws Exception {
        parseArgs(args);

        String userId = existingUserId != null ? existingUserId : "quicktest_burst_" + System.currentTimeMillis();
        List<String> aliases = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            aliases.add(userId + "_alias_" + i);
        }

        System.out.printf("Burst: %d assign/mark pairs, %d in flight, context %s, host %s%n", count, concurrency,
                context, hostUrl);
        System.out.println("client_session_id: " + sessionId);

        // Setup, like production: the user is initialized and has its groups and aliases set before the burst.
        try (ExperimentClient userClient = new ExperimentClient(userId, context, authToken, sessionId, hostUrl,
                Collections.emptyMap())) {
            if (existingUserId == null) {
                Map<String, List<String>> group = new HashMap<>();
                group.put(groupType, Collections.singletonList(groupId));
                Map<String, String> workingGroup = new HashMap<>();
                workingGroup.put(groupType, groupId);
                call("init", (ResponseCallback<InitializeUserResponse> cb) -> userClient.init(group, workingGroup, cb))
                        .join();
                System.out.printf("Initialized user %s (%s=%s)%n", userId, groupType, groupId);
            } else {
                System.out.printf("Using existing user %s%n", userId);
            }
            call("workinggroup", (ResponseCallback<ExperimentUserResponse> cb) -> {
                Map<String, String> workingGroup = new HashMap<>();
                workingGroup.put(groupType, groupId);
                userClient.setWorkingGroup(workingGroup, cb);
            }).join();
            call("useraliases", (ResponseCallback<UserAliasResponse> cb) -> userClient.setAltUserIds(aliases, cb))
                    .join();
            System.out.printf("Set %d aliases%n", aliases.size());
        } catch (RuntimeException e) {
            // Exit explicitly: the HTTP client's threads would otherwise keep the JVM alive.
            System.err.println("Setup failed, no burst sent: " + rootMessage(e));
            System.exit(1);
        }

        Semaphore inFlight = new Semaphore(concurrency);
        List<CompletableFuture<Void>> pairs = new ArrayList<>();
        long burstStart = System.nanoTime();
        for (int i = 0; i < count; i++) {
            inFlight.acquire();
            pairs.add(runPair(i, aliases.get(i)).whenComplete((v, e) -> inFlight.release()));
        }
        CompletableFuture.allOf(pairs.toArray(new CompletableFuture[0])).join();
        long burstMs = (System.nanoTime() - burstStart) / 1_000_000;

        printSummary(burstMs);
        System.exit(errors.isEmpty() ? 0 : 1);
    }

    /** One alias: /assign, then /mark on one of the decision points it was assigned. */
    private static CompletableFuture<Void> runPair(int index, String alias) {
        ExperimentClient client = new ExperimentClient(alias, context, authToken, sessionId, hostUrl,
                Collections.emptyMap());
        long pairStart = System.nanoTime();
        long assignStart = System.nanoTime();

        return call("assign", (ResponseCallback<List<ExperimentsResponse>> cb) -> client
                .getAllExperimentConditions(true, cb))
                .thenCompose(assignments -> {
                    long ms = elapsedMs(assignStart);
                    assignMs.add(ms);
                    if (verbose) {
                        System.out.printf("[%d] assign %d ms, %d decision points%n", index, ms, assignments.size());
                    }

                    String site;
                    String target;
                    String conditionCode;
                    if (assignments.isEmpty()) {
                        emptyAssignments.incrementAndGet();
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
                                markMs.add(markTook);
                                if (verbose) {
                                    System.out.printf("[%d] mark %s/%s %d ms%n", index, site, target, markTook);
                                }
                            });
                })
                .handle((v, e) -> {
                    if (e != null) {
                        errors.add("[" + index + "] " + rootMessage(e));
                    } else {
                        pairMs.add(elapsedMs(pairStart));
                    }
                    client.close();
                    int done = completed.incrementAndGet();
                    if (!verbose && (done % Math.max(1, count / 10) == 0 || done == count)) {
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

    private static void printSummary(long burstMs) {
        System.out.printf("%nBurst finished in %d ms: %d pairs ok, %d failed (client_session_id %s)%n", burstMs,
                pairMs.size(), errors.size(), sessionId);
        if (emptyAssignments.get() > 0) {
            System.out.printf("%d aliases got no assignments; their /mark used a placeholder target%n",
                    emptyAssignments.get());
        }
        printLatency("assign", assignMs);
        printLatency("mark", markMs);
        printLatency("pair", pairMs);
        errors.stream().limit(10).forEach(e -> System.out.println("  error " + e));
        if (errors.size() > 10) {
            System.out.printf("  ... and %d more errors%n", errors.size() - 10);
        }
    }

    private static void printLatency(String name, List<Long> samples) {
        if (samples.isEmpty()) {
            return;
        }
        List<Long> sorted = new ArrayList<>(samples);
        Collections.sort(sorted);
        System.out.printf("  %-6s n=%d  p50=%d ms  p95=%d ms  p99=%d ms  max=%d ms%n", name, sorted.size(),
                percentile(sorted, 50), percentile(sorted, 95), percentile(sorted, 99), sorted.get(sorted.size() - 1));
    }

    private static long percentile(List<Long> sorted, int p) {
        int index = (int) Math.ceil(p / 100.0 * sorted.size()) - 1;
        return sorted.get(Math.max(0, Math.min(index, sorted.size() - 1)));
    }

    private static long elapsedMs(long startNanos) {
        return (System.nanoTime() - startNanos) / 1_000_000;
    }

    private static String rootMessage(Throwable e) {
        Throwable t = e;
        while (t.getCause() != null) {
            t = t.getCause();
        }
        return t.getMessage();
    }

    private static void parseArgs(String[] args) {
        if (args.length == 0) {
            usage("missing <count>");
        }
        try {
            count = Integer.parseInt(args[0]);
        } catch (NumberFormatException e) {
            usage("<count> must be a number, got " + args[0]);
        }
        for (int i = 1; i < args.length; i++) {
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
                case "--concurrency" -> concurrency = Integer.parseInt(value);
                case "--env" -> hostUrl = switch (value) {
                    case "local" -> LOCAL_URL;
                    case "qa" -> ECS_QA_URL;
                    case "staging" -> ECS_STAGING_URL;
                    default -> {
                        usage("unknown --env " + value + " (local, qa, staging)");
                        yield null;
                    }
                };
                case "--url" -> hostUrl = value;
                case "--context" -> context = value;
                case "--user" -> existingUserId = value;
                case "--group-type" -> groupType = value;
                case "--group-id" -> groupId = value;
                case "--token" -> authToken = value;
                default -> usage("unknown option " + flag);
            }
        }
        if (count < 1 || concurrency < 1) {
            usage("<count> and --concurrency must be at least 1");
        }
    }

    private static void usage(String problem) {
        System.err.println(problem);
        System.err.println("usage: QuickTestBurst <count> [--concurrency 11] [--env local|qa|staging | --url <url>]"
                + " [--context assign-prog] [--user <existing user id>] [--group-type schoolId]"
                + " [--group-id test_class_group] [--token BearerToken] [--verbose]");
        System.exit(2);
    }
}
