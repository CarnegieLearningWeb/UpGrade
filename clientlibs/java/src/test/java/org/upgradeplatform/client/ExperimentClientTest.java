package org.upgradeplatform.client;

import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertFalse;
import static org.testng.Assert.assertNull;
import static org.testng.Assert.assertThrows;
import static org.testng.Assert.expectThrows;
import static org.testng.Assert.assertTrue;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.concurrent.ExecutionException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import org.eclipse.jdt.annotation.NonNull;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;
import org.upgradeplatform.interfaces.ResponseCallback;
import org.upgradeplatform.responsebeans.Assignment;
import org.upgradeplatform.responsebeans.ErrorResponse;
import org.upgradeplatform.responsebeans.ExperimentsResponse;
import org.upgradeplatform.responsebeans.MarkDecisionPoint;
import org.upgradeplatform.responsebeans.SendRewardResponse;
import org.upgradeplatform.utils.Utils.BinaryRewardValue;
import org.upgradeplatform.utils.Utils.MarkedDecisionPointStatus;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;

/**
 * Exercises ExperimentClient end-to-end against an in-process HTTP server that returns canned /v6 responses and
 * records request bodies.
 */
public class ExperimentClientTest {

	private static final ObjectMapper MAPPER = new ObjectMapper();

	private static final String SIMPLE_ASSIGNMENT = "[{\"site\":\"home\",\"target\":\"banner\",\"experimentType\":\"Simple\","
			+ "\"assignedCondition\":[{\"id\":\"cond-1\",\"conditionCode\":\"control\",\"payload\":null,\"experimentId\":\"exp-1\"}],"
			+ "\"assignedFactor\":null}]";

	private static final String FACTORIAL_ASSIGNMENT = "[{\"site\":\"quiz\",\"target\":\"hint\",\"experimentType\":\"Factorial\","
			+ "\"assignedCondition\":["
			+ "{\"id\":\"cond-A\",\"conditionCode\":\"combo-A\",\"payload\":null,\"experimentId\":\"exp-2\"},"
			+ "{\"id\":\"cond-B\",\"conditionCode\":\"combo-B\",\"payload\":null,\"experimentId\":\"exp-2\"}],"
			+ "\"assignedFactor\":[{\"color\":{\"level\":\"red\",\"payload\":null}},{\"color\":{\"level\":\"blue\",\"payload\":null}}]}]";

	private static String markResponse(String experimentId) {
		return "{\"id\":\"mark-1\",\"userId\":\"user-1\",\"site\":\"home\",\"target\":\"banner\",\"condition\":\"control\","
				+ "\"experimentId\":" + (experimentId == null ? "null" : "\"" + experimentId + "\"") + "}";
	}

	private HttpServer server;
	private ExecutorService serverExecutor;
	private final Map<String, String> responses = new ConcurrentHashMap<>();
	private final Map<String, List<String>> requestBodies = new ConcurrentHashMap<>();
	private final Map<String, List<String>> requestQueries = new ConcurrentHashMap<>();
	// Authorization header per request ("" when absent)
	private final Map<String, List<String>> requestAuthorization = new ConcurrentHashMap<>();
	// HTTP method and headers of the most recent request per path
	private final Map<String, String> lastMethod = new ConcurrentHashMap<>();
	private final Map<String, com.sun.net.httpserver.Headers> lastHeaders = new ConcurrentHashMap<>();
	private final Map<String, Integer> statusCodes = new ConcurrentHashMap<>();
	private ExperimentClient client;

	@BeforeMethod
	public void startServer() throws IOException {
		// TestNG reuses one instance for every test method, so reset recorded state explicitly
		responses.clear();
		requestBodies.clear();
		requestQueries.clear();
		requestAuthorization.clear();
		lastMethod.clear();
		lastHeaders.clear();
		statusCodes.clear();
		server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
		server.createContext("/", exchange -> {
			String path = exchange.getRequestURI().getPath();
			String query = exchange.getRequestURI().getQuery();
			lastMethod.put(path, exchange.getRequestMethod());
			lastHeaders.put(path, exchange.getRequestHeaders());
			String authorization = exchange.getRequestHeaders().getFirst("Authorization");
			requestAuthorization.computeIfAbsent(path, p -> new CopyOnWriteArrayList<>())
					.add(authorization == null ? "" : authorization);
			requestQueries.computeIfAbsent(path, p -> new CopyOnWriteArrayList<>()).add(query == null ? "" : query);
			try (InputStream in = exchange.getRequestBody()) {
				requestBodies.computeIfAbsent(path, p -> new CopyOnWriteArrayList<>())
						.add(new String(in.readAllBytes(), StandardCharsets.UTF_8));
			}
			byte[] body = responses.getOrDefault(path, "{}").getBytes(StandardCharsets.UTF_8);
			exchange.getResponseHeaders().add("Content-Type", "application/json");
			exchange.sendResponseHeaders(statusCodes.getOrDefault(path, 200), body.length);
			try (OutputStream out = exchange.getResponseBody()) {
				out.write(body);
			}
		});
		// handle requests concurrently, as a real server would
		serverExecutor = Executors.newCachedThreadPool();
		server.setExecutor(serverExecutor);
		server.start();
		client = new ExperimentClient("user-1", "test-app", "token",
				"http://127.0.0.1:" + server.getAddress().getPort(), Collections.emptyMap());
	}

	@AfterMethod
	public void stopServer() {
		client.close();
		server.stop(0);
		serverExecutor.shutdownNow();
	}

	private JsonNode lastBody(String path) throws IOException {
		List<String> bodies = requestBodies.get(path);
		return MAPPER.readTree(bodies.get(bodies.size() - 1));
	}

	private static <T> ResponseCallback<T> into(CompletableFuture<T> future) {
		return new ResponseCallback<T>() {
			@Override
			public void onSuccess(@NonNull T t) {
				future.complete(t);
			}

			@Override
			public void onError(@NonNull ErrorResponse error) {
				future.completeExceptionally(new AssertionError(error.toString()));
			}
		};
	}

	private List<ExperimentsResponse> fetchAssignments() throws Exception {
		CompletableFuture<List<ExperimentsResponse>> assignments = new CompletableFuture<>();
		client.getAllExperimentConditions(into(assignments));
		return assignments.get(5, TimeUnit.SECONDS);
	}

	private MarkDecisionPoint mark(String site, String target, String condition) throws Exception {
		CompletableFuture<MarkDecisionPoint> marked = new CompletableFuture<>();
		client.markDecisionPoint(site, target, condition, MarkedDecisionPointStatus.CONDITION_APPLIED, into(marked));
		return marked.get(5, TimeUnit.SECONDS);
	}

	@Test
	public void markSendsCachedExperimentAndConditionIds() throws Exception {
		responses.put("/api/v6/assign", SIMPLE_ASSIGNMENT);
		responses.put("/api/v6/mark", markResponse("exp-1"));
		fetchAssignments();

		mark("home", "banner", "control");

		JsonNode assignedCondition = lastBody("/api/v6/mark").path("data").path("assignedCondition");
		assertEquals(assignedCondition.path("conditionCode").asText(), "control");
		assertEquals(assignedCondition.path("experimentId").asText(), "exp-1");
		assertEquals(assignedCondition.path("id").asText(), "cond-1");
	}

	@Test
	public void markWithColdCacheSendsOnlyConditionCode() throws Exception {
		responses.put("/api/v6/mark", markResponse(null));

		mark("home", "banner", "control");

		JsonNode assignedCondition = lastBody("/api/v6/mark").path("data").path("assignedCondition");
		assertEquals(assignedCondition.path("conditionCode").asText(), "control");
		assertTrue(assignedCondition.path("experimentId").isNull());
	}

	@Test
	public void assignmentMarkSendsItsExperimentAndConditionIds() throws Exception {
		responses.put("/api/v6/assign", SIMPLE_ASSIGNMENT);
		responses.put("/api/v6/mark", markResponse("exp-1"));
		CompletableFuture<Assignment> assignment = new CompletableFuture<>();
		client.getExperimentCondition("home", "banner", into(assignment));

		CompletableFuture<MarkDecisionPoint> marked = new CompletableFuture<>();
		assignment.get(5, TimeUnit.SECONDS).markDecisionPoint(MarkedDecisionPointStatus.CONDITION_APPLIED, into(marked));
		marked.get(5, TimeUnit.SECONDS);

		JsonNode assignedCondition = lastBody("/api/v6/mark").path("data").path("assignedCondition");
		assertEquals(assignedCondition.path("experimentId").asText(), "exp-1");
		assertEquals(assignedCondition.path("id").asText(), "cond-1");
	}

	@Test
	public void markRotatesFactorsAlongWithConditions() throws Exception {
		responses.put("/api/v6/assign", FACTORIAL_ASSIGNMENT);
		responses.put("/api/v6/mark", markResponse("exp-2"));
		fetchAssignments();

		mark("quiz", "hint", "combo-A");

		ExperimentsResponse rotated = fetchAssignments().get(0);
		assertEquals(rotated.getAssignedCondition()[0].getConditionCode(), "combo-B");
		assertEquals(rotated.getAssignedFactor()[0].get("color").getLevel(), "blue");
	}

	@Test
	public void nullCallbackDoesNotThrowAndStillCaches() throws Exception {
		responses.put("/api/v6/assign", SIMPLE_ASSIGNMENT);
		client.getAllExperimentConditions(null);

		// before the fix, the null callback NPE'd inside the response handler, so the result was never cached and
		// the next call made a second request
		long deadline = System.currentTimeMillis() + 5000;
		while (requestBodies.getOrDefault("/api/v6/assign", List.of()).isEmpty()
				&& System.currentTimeMillis() < deadline) {
			Thread.sleep(10);
		}
		Thread.sleep(500);
		fetchAssignments();
		assertEquals(requestBodies.get("/api/v6/assign").size(), 1);
	}

	private static final String ACCEPTED_REWARD = "{\"mode\":\"accepted\",\"message\":\"Reward received and is being processed.\","
			+ "\"request\":{\"rewardValue\":\"SUCCESS\",\"experimentId\":\"exp-1\"}}";

	private SendRewardResponse await(CompletableFuture<SendRewardResponse> future) throws Exception {
		return future.get(5, TimeUnit.SECONDS);
	}

	@Test
	public void sendRewardForExperimentPostsExperimentIdWithoutQueryParam() throws Exception {
		responses.put("/api/v6/reward", ACCEPTED_REWARD);
		CompletableFuture<SendRewardResponse> sent = new CompletableFuture<>();
		client.sendRewardForExperiment(BinaryRewardValue.SUCCESS, "exp-1", into(sent));

		SendRewardResponse response = await(sent);
		assertEquals(response.getMode(), "accepted");
		assertEquals(response.getRequest().getExperimentId(), "exp-1");
		assertEquals(requestQueries.get("/api/v6/reward").get(0), "");

		JsonNode body = lastBody("/api/v6/reward");
		assertEquals(body.path("rewardValue").asText(), "SUCCESS");
		assertEquals(body.path("experimentId").asText(), "exp-1");
		assertFalse(body.has("context"));
		assertFalse(body.has("decisionPoint"));
	}

	@Test
	public void sendRewardForDecisionPointPostsExplicitContextAndAwaitResult() throws Exception {
		responses.put("/api/v6/reward", "{\"mode\":\"processed\",\"success\":true,\"message\":\"Reward recorded.\","
				+ "\"request\":{\"rewardValue\":\"FAILURE\",\"context\":\"other-app\","
				+ "\"decisionPoint\":{\"site\":\"home\",\"target\":\"\"}}}");
		CompletableFuture<SendRewardResponse> sent = new CompletableFuture<>();
		client.sendRewardForDecisionPoint(BinaryRewardValue.FAILURE, "other-app", "home", null, true, into(sent));

		SendRewardResponse response = await(sent);
		assertEquals(response.getMode(), "processed");
		assertEquals(response.getSuccess(), Boolean.TRUE);
		assertEquals(requestQueries.get("/api/v6/reward").get(0), "awaitResult=true");

		JsonNode body = lastBody("/api/v6/reward");
		assertEquals(body.path("rewardValue").asText(), "FAILURE");
		// context is whatever the caller passed, not the client's own context
		assertEquals(body.path("context").asText(), "other-app");
		assertEquals(body.path("decisionPoint").path("site").asText(), "home");
		assertEquals(body.path("decisionPoint").path("target").asText(), "");
		assertFalse(body.has("experimentId"));
	}

	@Test
	public void sendRewardReportsConflictAsError() throws Exception {
		responses.put("/api/v6/reward", "{\"message\":\"no matching enrollment\"}");
		statusCodes.put("/api/v6/reward", 409);
		CompletableFuture<SendRewardResponse> sent = new CompletableFuture<>();
		client.sendRewardForExperiment(BinaryRewardValue.SUCCESS, "exp-1", true, into(sent));

		ExecutionException failure = expectThrows(ExecutionException.class, () -> await(sent));
		assertTrue(failure.getCause().getMessage().contains("409"), failure.getCause().getMessage());
		// 4xx is not retried
		assertEquals(requestBodies.get("/api/v6/reward").size(), 1);
	}

	@Test
	public void sendRewardRejectsMissingIdentifiers() {
		assertThrows(IllegalArgumentException.class,
				() -> client.sendRewardForExperiment(BinaryRewardValue.SUCCESS, "", null));
		assertThrows(IllegalArgumentException.class,
				() -> client.sendRewardForDecisionPoint(BinaryRewardValue.SUCCESS, null, "home", "", null));
		assertThrows(IllegalArgumentException.class,
				() -> client.sendRewardForDecisionPoint(BinaryRewardValue.SUCCESS, "app", "", "", null));
		assertThrows(IllegalArgumentException.class, () -> client.sendRewardForExperiment(null, "exp-1", null));
	}

	private List<String> fetchFlags() throws Exception {
		CompletableFuture<List<String>> flags = new CompletableFuture<>();
		client.getAllFeatureFlags(into(flags));
		return flags.get(5, TimeUnit.SECONDS);
	}

	@Test
	public void featureFlagRequestOmitsSessionGroupsByDefault() throws Exception {
		responses.put("/api/v6/featureflag", "[\"flag\"]");
		assertEquals(fetchFlags(), List.of("flag"));

		JsonNode body = lastBody("/api/v6/featureflag");
		assertEquals(body.path("context").asText(), "test-app");
		assertFalse(body.has("groupsForSession"));
		assertFalse(body.has("includeStoredUserGroups"));
	}

	@Test
	public void sessionGroupsAreSentAndInvalidateTheFlagCache() throws Exception {
		responses.put("/api/v6/featureflag", "[\"flag\"]");
		fetchFlags();

		client.setFeatureFlagUserGroupsForSession(Map.of("classId", List.of("c1")), false);
		fetchFlags();

		assertEquals(requestBodies.get("/api/v6/featureflag").size(), 2);
		JsonNode body = lastBody("/api/v6/featureflag");
		assertEquals(body.path("groupsForSession").path("classId").get(0).asText(), "c1");
		assertFalse(body.path("includeStoredUserGroups").asBoolean(true));

		client.clearFeatureFlagUserGroupsForSession();
		fetchFlags();

		assertEquals(requestBodies.get("/api/v6/featureflag").size(), 3);
		assertFalse(lastBody("/api/v6/featureflag").has("groupsForSession"));
	}

	@Test
	public void sessionGroupsRequireGroups() {
		assertThrows(IllegalArgumentException.class, () -> client.setFeatureFlagUserGroupsForSession(null, true));
	}

	@Test
	public void nonIdempotentWritesAreNotRetriedOnServerError() throws Exception {
		statusCodes.put("/api/v6/reward", 503);
		statusCodes.put("/api/v6/mark", 503);

		CompletableFuture<SendRewardResponse> sent = new CompletableFuture<>();
		client.sendRewardForExperiment(BinaryRewardValue.SUCCESS, "exp-1", into(sent));
		expectThrows(ExecutionException.class, () -> await(sent));

		CompletableFuture<MarkDecisionPoint> marked = new CompletableFuture<>();
		client.markDecisionPoint("home", "banner", "control", MarkedDecisionPointStatus.CONDITION_APPLIED,
				into(marked));
		expectThrows(ExecutionException.class, () -> marked.get(5, TimeUnit.SECONDS));

		// a resent reward would be counted twice by the server, biasing adaptive assignment
		assertEquals(requestBodies.get("/api/v6/reward").size(), 1);
		assertEquals(requestBodies.get("/api/v6/mark").size(), 1);
	}

	@Test
	public void idempotentReadsAreRetriedOnceOnServerError() throws Exception {
		statusCodes.put("/api/v6/assign", 503);

		CompletableFuture<List<ExperimentsResponse>> assignments = new CompletableFuture<>();
		client.getAllExperimentConditions(into(assignments));
		expectThrows(ExecutionException.class, () -> assignments.get(5, TimeUnit.SECONDS));

		assertEquals(requestBodies.get("/api/v6/assign").size(), 2);
	}

	@Test
	public void decisionPointLookupIsCaseSensitiveLikeTheServer() throws Exception {
		responses.put("/api/v6/assign", SIMPLE_ASSIGNMENT);

		CompletableFuture<Assignment> exact = new CompletableFuture<>();
		client.getExperimentCondition("home", "banner", into(exact));
		assertEquals(exact.get(5, TimeUnit.SECONDS).getAssignedCondition().getConditionCode(), "control");

		// a different casing would get a condition the server can't attribute on /mark, so it must not match
		CompletableFuture<Assignment> otherCase = new CompletableFuture<>();
		client.getExperimentCondition("Home", "Banner", into(otherCase));
		assertNull(otherCase.get(5, TimeUnit.SECONDS).getCondition());
	}

	private static final String USER = "{\"id\":\"user-1\",\"group\":{\"classId\":[\"c2\"]},\"workingGroup\":{\"classId\":\"c2\"}}";

	private void primeCaches() throws Exception {
		responses.put("/api/v6/assign", SIMPLE_ASSIGNMENT);
		responses.put("/api/v6/featureflag", "[\"flag\"]");
		fetchAssignments();
		fetchFlags();
	}

	private int requestCount(String path) {
		return requestBodies.getOrDefault(path, List.of()).size();
	}

	private void assertCachesCleared(boolean expectCleared) throws Exception {
		int assignBefore = requestCount("/api/v6/assign");
		int flagsBefore = requestCount("/api/v6/featureflag");
		fetchAssignments();
		fetchFlags();
		assertEquals(requestCount("/api/v6/assign") > assignBefore, expectCleared, "assignments refetched");
		assertEquals(requestCount("/api/v6/featureflag") > flagsBefore, expectCleared, "feature flags refetched");
	}

	@Test
	public void initClearsAssignmentAndFlagCaches() throws Exception {
		primeCaches();
		responses.put("/api/v6/init", USER);
		CompletableFuture<org.upgradeplatform.responsebeans.InitializeUserResponse> done = new CompletableFuture<>();
		client.init(into(done));
		done.get(5, TimeUnit.SECONDS);
		assertCachesCleared(true);
	}

	@Test
	public void groupChangesClearAssignmentAndFlagCaches() throws Exception {
		responses.put("/api/v6/groupmembership", USER);
		responses.put("/api/v6/workinggroup", USER);

		primeCaches();
		CompletableFuture<org.upgradeplatform.responsebeans.ExperimentUserResponse> group = new CompletableFuture<>();
		client.setGroupMembership(Map.of("classId", List.of("c2")), into(group));
		group.get(5, TimeUnit.SECONDS);
		assertCachesCleared(true);

		CompletableFuture<org.upgradeplatform.responsebeans.ExperimentUserResponse> working = new CompletableFuture<>();
		client.setWorkingGroup(Map.of("classId", "c2"), into(working));
		working.get(5, TimeUnit.SECONDS);
		assertCachesCleared(true);
	}

	@Test
	public void failedGroupChangeKeepsCaches() throws Exception {
		primeCaches();
		statusCodes.put("/api/v6/groupmembership", 400);
		CompletableFuture<org.upgradeplatform.responsebeans.ExperimentUserResponse> group = new CompletableFuture<>();
		client.setGroupMembership(Map.of("classId", List.of("c2")), into(group));
		expectThrows(ExecutionException.class, () -> group.get(5, TimeUnit.SECONDS));
		assertCachesCleared(false);
	}

	@Test
	public void setAltUserIdsClearsAssignmentAndFlagCaches() throws Exception {
		primeCaches();
		responses.put("/api/v6/useraliases", "{\"userId\":\"user-1\",\"aliases\":[\"alias-1\"]}");
		CompletableFuture<org.upgradeplatform.responsebeans.UserAliasResponse> aliases = new CompletableFuture<>();
		client.setAltUserIds(List.of("alias-1"), into(aliases));
		aliases.get(5, TimeUnit.SECONDS);
		assertCachesCleared(true);
	}

	@Test
	public void authTokenIsSentAsBearerHeader() throws Exception {
		responses.put("/api/v6/assign", SIMPLE_ASSIGNMENT);
		fetchAssignments();
		assertEquals(requestAuthorization.get("/api/v6/assign").get(0), "Bearer token");
	}

	@Test
	public void authTokenIsOptional() throws Exception {
		String baseUrl = "http://127.0.0.1:" + server.getAddress().getPort();
		responses.put("/api/v6/assign", SIMPLE_ASSIGNMENT);
		for (String token : new String[] { null, "" }) {
			// used to throw IllegalArgumentException; now the Authorization header is just omitted, as in JS/Python
			try (ExperimentClient noTokenClient = new ExperimentClient("user-1", "test-app", token, baseUrl, null)) {
				CompletableFuture<List<ExperimentsResponse>> assignments = new CompletableFuture<>();
				noTokenClient.getAllExperimentConditions(into(assignments));
				assignments.get(5, TimeUnit.SECONDS);
			}
		}
		assertEquals(requestAuthorization.get("/api/v6/assign"), List.of("", ""));
	}

	@Test
	public void noExperimentPlaceholderHasNullConditionAndNullSafeShortcuts() throws Exception {
		responses.put("/api/v6/assign", "[]");
		responses.put("/api/v6/mark", markResponse(null));

		CompletableFuture<Assignment> lookup = new CompletableFuture<>();
		client.getExperimentCondition("home", "banner", into(lookup));
		Assignment assignment = lookup.get(5, TimeUnit.SECONDS);

		// unchanged from before: callers that detect "no experiment" by a null condition keep working
		assertNull(assignment.getAssignedCondition());
		// the shortcuts handle that case instead of throwing
		assertNull(assignment.getCondition());
		assertNull(assignment.getPayload());
		// a null type is the "no experiment here" signal (JS reports SIMPLE instead)
		assertNull(assignment.getExperimentType());
		assertNull(assignment.getFactorLevel("color"));

		CompletableFuture<ExperimentsResponse> raw = new CompletableFuture<>();
		client.getAllExperimentConditions("home", "banner", into(raw));
		assertNull(raw.get(5, TimeUnit.SECONDS).getAssignedCondition());

		CompletableFuture<MarkDecisionPoint> marked = new CompletableFuture<>();
		assignment.markDecisionPoint(MarkedDecisionPointStatus.NO_CONDITION_ASSIGNED, into(marked));
		marked.get(5, TimeUnit.SECONDS);
		JsonNode body = lastBody("/api/v6/mark");
		assertEquals(body.path("status").asText(), MarkedDecisionPointStatus.NO_CONDITION_ASSIGNED.toString());
		assertTrue(body.path("data").path("assignedCondition").path("conditionCode").isNull());
	}

	@Test
	public void assignmentWithEmptyConditionListDoesNotThrow() throws Exception {
		responses.put("/api/v6/assign", "[{\"site\":\"home\",\"target\":\"banner\",\"experimentType\":\"Simple\","
				+ "\"assignedCondition\":[],\"assignedFactor\":[]}]");
		CompletableFuture<Assignment> lookup = new CompletableFuture<>();
		client.getExperimentCondition("home", "banner", into(lookup));
		assertNull(lookup.get(5, TimeUnit.SECONDS).getCondition());
	}

	@Test
	public void assignmentShortcutsReadTheAssignedCondition() throws Exception {
		responses.put("/api/v6/assign", SIMPLE_ASSIGNMENT);
		CompletableFuture<Assignment> lookup = new CompletableFuture<>();
		client.getExperimentCondition("home", "banner", into(lookup));
		Assignment assignment = lookup.get(5, TimeUnit.SECONDS);

		assertEquals(assignment.getCondition(), "control");
		assertNull(assignment.getPayload());
		assertEquals(assignment.getExperimentType(), org.upgradeplatform.utils.Utils.ExperimentType.Simple);
	}

	// ---- Request serialization: each endpoint's method and body match what the backend's validator expects ----

	private static <T> T call(Class<T> responseType, java.util.function.Consumer<ResponseCallback<T>> request)
			throws Exception {
		CompletableFuture<T> future = new CompletableFuture<>();
		request.accept(into(future));
		return responseType.cast(future.get(5, TimeUnit.SECONDS));
	}

	private static java.util.Set<String> fieldNames(JsonNode node) {
		java.util.Set<String> names = new java.util.TreeSet<>();
		node.fieldNames().forEachRemaining(names::add);
		return names;
	}

	@Test
	public void initSendsOnlyGroupAndWorkingGroup() throws Exception {
		responses.put("/api/v6/init", USER);

		call(org.upgradeplatform.responsebeans.InitializeUserResponse.class, cb -> client.init(cb));
		JsonNode empty = lastBody("/api/v6/init");
		assertEquals(lastMethod.get("/api/v6/init"), "POST");
		// /init rejects any other field (forbidNonWhitelisted), so the field set must stay exactly this
		assertEquals(fieldNames(empty), java.util.Set.of("group", "workingGroup"));
		assertTrue(empty.path("group").isNull());
		assertTrue(empty.path("workingGroup").isNull());

		call(org.upgradeplatform.responsebeans.InitializeUserResponse.class, cb -> client.init(Map.of("classId", List.of("c1")), cb));
		JsonNode withGroup = lastBody("/api/v6/init");
		assertEquals(withGroup.path("group").path("classId").get(0).asText(), "c1");
		assertTrue(withGroup.path("workingGroup").isNull());

		call(org.upgradeplatform.responsebeans.InitializeUserResponse.class, cb -> client.init(Map.of("classId", List.of("c1")), Map.of("classId", "c1"), cb));
		JsonNode both = lastBody("/api/v6/init");
		assertEquals(fieldNames(both), java.util.Set.of("group", "workingGroup"));
		assertEquals(both.path("workingGroup").path("classId").asText(), "c1");
	}

	@Test
	public void setGroupMembershipPatchesGroup() throws Exception {
		responses.put("/api/v6/groupmembership", USER);
		call(org.upgradeplatform.responsebeans.ExperimentUserResponse.class, cb -> client.setGroupMembership(Map.of("classId", List.of("c1", "c2")), cb));

		assertEquals(lastMethod.get("/api/v6/groupmembership"), "PATCH");
		JsonNode body = lastBody("/api/v6/groupmembership");
		assertEquals(body.path("group").path("classId").get(1).asText(), "c2");
		// the bean also sends null workingGroup/createdAt/etc.; the server strips unknown fields and treats a null
		// workingGroup as absent, so only check that no other field carries a value
		fieldNames(body).stream().filter(name -> !name.equals("group"))
				.forEach(name -> assertTrue(body.path(name).isNull(), name + " should be null"));
	}

	@Test
	public void setWorkingGroupPatchesWorkingGroup() throws Exception {
		responses.put("/api/v6/workinggroup", USER);
		call(org.upgradeplatform.responsebeans.ExperimentUserResponse.class, cb -> client.setWorkingGroup(Map.of("classId", "c1"), cb));

		assertEquals(lastMethod.get("/api/v6/workinggroup"), "PATCH");
		JsonNode body = lastBody("/api/v6/workinggroup");
		assertEquals(body.path("workingGroup").path("classId").asText(), "c1");
		fieldNames(body).stream().filter(name -> !name.equals("workingGroup"))
				.forEach(name -> assertTrue(body.path(name).isNull(), name + " should be null"));
	}

	@Test
	public void setAltUserIdsPatchesAliases() throws Exception {
		responses.put("/api/v6/useraliases", "{\"userId\":\"user-1\",\"aliases\":[\"alias-1\",\"alias-2\"]}");
		call(org.upgradeplatform.responsebeans.UserAliasResponse.class, cb -> client.setAltUserIds(List.of("alias-1", "alias-2"), cb));

		assertEquals(lastMethod.get("/api/v6/useraliases"), "PATCH");
		JsonNode body = lastBody("/api/v6/useraliases");
		assertEquals(fieldNames(body), java.util.Set.of("aliases"));
		assertEquals(body.path("aliases").get(0).asText(), "alias-1");
		assertEquals(body.path("aliases").get(1).asText(), "alias-2");
	}

	@Test
	public void getAllExperimentConditionsPostsContext() throws Exception {
		responses.put("/api/v6/assign", SIMPLE_ASSIGNMENT);
		fetchAssignments();

		assertEquals(lastMethod.get("/api/v6/assign"), "POST");
		JsonNode body = lastBody("/api/v6/assign");
		assertEquals(fieldNames(body), java.util.Set.of("context"));
		assertEquals(body.path("context").asText(), "test-app");
	}

	private Assignment lookup(String site, String target) throws Exception {
		CompletableFuture<Assignment> assignment = new CompletableFuture<>();
		client.getExperimentCondition(site, target, into(assignment));
		return assignment.get(5, TimeUnit.SECONDS);
	}

	@Test
	public void getExperimentConditionAsksAssignForJustThatDecisionPoint() throws Exception {
		responses.put("/api/v6/assign", SIMPLE_ASSIGNMENT);
		assertEquals(lookup("home", "banner").getCondition(), "control");

		JsonNode body = lastBody("/api/v6/assign");
		assertEquals(fieldNames(body), java.util.Set.of("context", "decisionPoint"));
		assertEquals(body.path("context").asText(), "test-app");
		assertEquals(body.path("decisionPoint").path("site").asText(), "home");
		assertEquals(body.path("decisionPoint").path("target").asText(), "banner");
	}

	@Test
	public void getExperimentConditionSendsANullTargetAsEmpty() throws Exception {
		responses.put("/api/v6/assign", "[]");
		lookup("home", null);

		JsonNode target = lastBody("/api/v6/assign").path("decisionPoint").path("target");
		assertTrue(target.isTextual());
		assertEquals(target.asText(), "");
	}

	@Test
	public void getExperimentConditionCachesTheDecisionPointItFetched() throws Exception {
		responses.put("/api/v6/assign", SIMPLE_ASSIGNMENT);
		lookup("home", "banner");
		assertEquals(lookup("home", "banner").getCondition(), "control");

		assertEquals(requestCount("/api/v6/assign"), 1);
	}

	@Test
	public void getExperimentConditionAsksAgainWhenThereWasNoAssignment() throws Exception {
		// an empty response adds nothing to the cache, so the next lookup can't tell it already asked
		responses.put("/api/v6/assign", "[]");
		assertNull(lookup("home", "banner").getCondition());
		assertNull(lookup("home", "banner").getCondition());

		assertEquals(requestCount("/api/v6/assign"), 2);
	}

	@Test
	public void getExperimentConditionUsesAFullContextCacheWithoutAsking() throws Exception {
		responses.put("/api/v6/assign", SIMPLE_ASSIGNMENT);
		fetchAssignments();

		assertEquals(lookup("home", "banner").getCondition(), "control");
		// the full context also answers for a decision point with no assignment
		assertNull(lookup("quiz", "hint").getCondition());
		assertEquals(requestCount("/api/v6/assign"), 1);
	}

	@Test
	public void getAllExperimentConditionsIgnoresACacheOfSingleDecisionPoints() throws Exception {
		responses.put("/api/v6/assign", SIMPLE_ASSIGNMENT);
		lookup("home", "banner");
		fetchAssignments();

		assertEquals(requestCount("/api/v6/assign"), 2);
		assertFalse(lastBody("/api/v6/assign").has("decisionPoint"));

		// once the full context is cached, neither call asks again
		fetchAssignments();
		lookup("quiz", "hint");
		assertEquals(requestCount("/api/v6/assign"), 2);
	}

	@Test
	public void clearingCachesForgetsTheFullContext() throws Exception {
		responses.put("/api/v6/assign", SIMPLE_ASSIGNMENT);
		responses.put("/api/v6/init", USER);
		fetchAssignments();
		CompletableFuture<org.upgradeplatform.responsebeans.InitializeUserResponse> done = new CompletableFuture<>();
		client.init(into(done));
		done.get(5, TimeUnit.SECONDS);

		// with the full context gone, a lookup asks /assign for just its decision point again, and caches the answer
		lookup("home", "banner");
		lookup("home", "banner");
		assertEquals(requestCount("/api/v6/assign"), 2);
		assertTrue(lastBody("/api/v6/assign").has("decisionPoint"));
	}

	@Test
	public void logPostsValueWithMetricsAndGroupedMetrics() throws Exception {
		responses.put("/api/v6/log", "[{\"id\":\"log-1\",\"uniquifier\":null}]");
		java.util.HashMap<String, Object> attributes = new java.util.HashMap<>(Map.of("score", 5, "level", "easy"));
		java.util.HashMap<String, Object> groupAttributes = new java.util.HashMap<>(Map.of("timeSeconds", 30));
		org.upgradeplatform.requestbeans.LogInput input = new org.upgradeplatform.requestbeans.LogInput(
				"2026-11-04T12:00:00Z",
				new org.upgradeplatform.requestbeans.LogMetrics(attributes, List.of(
						new org.upgradeplatform.requestbeans.LogGroupMetrics("workspace", "ws-1", "u-1", groupAttributes))));

		CompletableFuture<List<org.upgradeplatform.responsebeans.LogEventResponse>> logged = new CompletableFuture<>();
		client.log(List.of(input), into(logged));
		logged.get(5, TimeUnit.SECONDS);

		assertEquals(lastMethod.get("/api/v6/log"), "POST");
		JsonNode body = lastBody("/api/v6/log");
		assertEquals(fieldNames(body), java.util.Set.of("value"));
		JsonNode entry = body.path("value").get(0);
		assertEquals(entry.path("timestamp").asText(), "2026-11-04T12:00:00Z");
		assertEquals(entry.path("metrics").path("attributes").path("score").asInt(), 5);
		assertEquals(entry.path("metrics").path("attributes").path("level").asText(), "easy");
		JsonNode grouped = entry.path("metrics").path("groupedMetrics").get(0);
		assertEquals(grouped.path("groupClass").asText(), "workspace");
		assertEquals(grouped.path("groupKey").asText(), "ws-1");
		assertEquals(grouped.path("groupUniquifier").asText(), "u-1");
		assertEquals(grouped.path("attributes").path("timeSeconds").asInt(), 30);
	}

	@Test
	public void requestsCarryStandardClientHeaders() throws Exception {
		responses.put("/api/v6/assign", SIMPLE_ASSIGNMENT);
		fetchAssignments();

		com.sun.net.httpserver.Headers headers = lastHeaders.get("/api/v6/assign");
		assertEquals(headers.getFirst("User-Id"), "user-1");
		assertEquals(headers.getFirst("Client-Context"), "test-app");
		assertTrue(headers.getFirst("Content-Type").startsWith("application/json"), headers.getFirst("Content-Type"));
		assertFalse(isNullOrEmpty(headers.getFirst("Session-Id")), "Session-Id");
		// filled in from pom.xml at build time; an unfiltered placeholder means resource filtering broke
		String version = headers.getFirst("Client-Version");
		assertFalse(isNullOrEmpty(version) || version.contains("${"), "Client-Version: " + version);
	}

	private static boolean isNullOrEmpty(String value) {
		return value == null || value.isEmpty();
	}

	@Test
	public void nullPropertiesAreAllowed() {
		// used to NPE in APIService.createClient
		new ExperimentClient("user-1", "test-app", "token", "http://127.0.0.1:1", null).close();
	}
}
