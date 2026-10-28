package org.upgradeplatform.client;

import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertFalse;
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
	private final Map<String, String> responses = new ConcurrentHashMap<>();
	private final Map<String, List<String>> requestBodies = new ConcurrentHashMap<>();
	private final Map<String, List<String>> requestQueries = new ConcurrentHashMap<>();
	private final Map<String, Integer> statusCodes = new ConcurrentHashMap<>();
	private ExperimentClient client;

	@BeforeMethod
	public void startServer() throws IOException {
		// TestNG reuses one instance for every test method, so reset recorded state explicitly
		responses.clear();
		requestBodies.clear();
		requestQueries.clear();
		statusCodes.clear();
		server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
		server.createContext("/", exchange -> {
			String path = exchange.getRequestURI().getPath();
			String query = exchange.getRequestURI().getQuery();
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
		server.start();
		client = new ExperimentClient("user-1", "test-app", "token",
				"http://127.0.0.1:" + server.getAddress().getPort(), Collections.emptyMap());
	}

	@AfterMethod
	public void stopServer() {
		client.close();
		server.stop(0);
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
	public void nullPropertiesAreAllowed() {
		// used to NPE in APIService.createClient
		new ExperimentClient("user-1", "test-app", "token", "http://127.0.0.1:1", null).close();
	}
}
