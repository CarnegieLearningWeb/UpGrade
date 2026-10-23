package org.upgradeplatform.client;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

/**
 * A basic local web page for QuickTestBurst: fill in the options, start a run, watch its output, stop it.
 *
 * <pre>
 * yarn quickburst:ui                  (from the repo root; compiles first, see scripts/quickburst-ui.sh)
 * yarn quickburst:ui --port 8091
 * mvn exec:java -Dexec.mainClass="org.upgradeplatform.client.QuickTestBurstUi"
 * mvn exec:java -Dexec.mainClass="org.upgradeplatform.client.QuickTestBurstUi" -Dexec.args="--port 8091"
 * </pre>
 *
 * then open http://localhost:8090 (or the port given). Ctrl-C stops it, along with any run in progress.
 *
 * Each run is its own QuickTestBurst process, started with this one's classpath and environment, so {@code qa} and
 * {@code staging} need UPGRADE_QA_URL / UPGRADE_STAGING_URL set (see QuickTestHosts) before this starts; the page
 * shows which are missing. One run at a time. The page shows the command line for the options it sends, so any run
 * can be repeated from a terminal. It listens on localhost only.
 */
public class QuickTestBurstUi {
    private static final int DEFAULT_PORT = 8090;
    // Every POST must carry this. A page on another site can't add it without a CORS preflight, which this never
    // answers, so another site can't start runs.
    private static final String REQUEST_HEADER = "X-QuickTestBurst";
    // Older lines are dropped past this, so a long --verbose run doesn't grow without bound. The summary is printed
    // last, so it's always kept.
    private static final int MAX_LINES = 20_000;
    private static final String JSON = "application/json; charset=utf-8";

    private static int port = DEFAULT_PORT;
    private static String page;
    private static int runCount = 0;
    private static Run current = null;

    /** One QuickTestBurst process and the output it has printed so far. */
    private static final class Run {
        final int id;
        final List<String> args;
        final Process process;
        // These three are guarded by this Run.
        final List<String> lines = new ArrayList<>();
        int droppedLines = 0;
        Integer exitCode = null;

        Run(int id, List<String> args, Process process) {
            this.id = id;
            this.args = args;
            this.process = process;
        }

        synchronized void add(String line) {
            lines.add(line);
            if (lines.size() > MAX_LINES) {
                int drop = MAX_LINES / 2;
                lines.subList(0, drop).clear();
                droppedLines += drop;
            }
        }

        synchronized void finish(int code) {
            exitCode = code;
        }

        /** Status as JSON, with the lines from line number {@code from} on. */
        synchronized String status(int from) {
            int start = Math.max(from, droppedLines);
            int next = droppedLines + lines.size();
            List<String> newLines = start >= next ? List.of() : lines.subList(start - droppedLines, lines.size());
            return "{\"id\":" + id + ",\"running\":" + (exitCode == null) + ",\"exitCode\":" + exitCode + ",\"args\":"
                    + json(args) + ",\"from\":" + start + ",\"next\":" + next + ",\"lines\":" + json(newLines) + "}";
        }
    }

    public static void main(String[] args) throws IOException {
        if (args.length == 2 && args[0].equals("--port")) {
            port = Integer.parseInt(args[1]);
        } else if (args.length != 0) {
            System.err.println("usage: QuickTestBurstUi [--port " + DEFAULT_PORT + "]");
            System.exit(2);
        }
        try (InputStream in = QuickTestBurstUi.class.getResourceAsStream("quicktest-burst-ui.html")) {
            page = new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }

        HttpServer server = HttpServer.create(new InetSocketAddress(InetAddress.getLoopbackAddress(), port), 0);
        server.createContext("/", QuickTestBurstUi::handle);
        server.start();
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            Run run = currentRun();
            if (run != null) {
                run.process.destroy();
            }
        }));
        System.out.println("QuickTestBurst UI at http://localhost:" + port);
    }

    private static void handle(HttpExchange exchange) throws IOException {
        try {
            if (!allowed(exchange)) {
                send(exchange, 403, "text/plain", "forbidden");
                return;
            }
            String route = exchange.getRequestMethod() + " " + exchange.getRequestURI().getPath();
            switch (route) {
                case "GET /" -> send(exchange, 200, "text/html; charset=utf-8", page);
                case "GET /config" -> send(exchange, 200, JSON, "{\"qa\":" + isSet("UPGRADE_QA_URL") + ",\"staging\":"
                        + isSet("UPGRADE_STAGING_URL") + "}");
                case "GET /status" -> status(exchange);
                case "POST /run" -> run(exchange);
                case "POST /stop" -> stop(exchange);
                default -> send(exchange, 404, "text/plain", "not found");
            }
        } catch (Exception e) {
            send(exchange, 500, "text/plain", String.valueOf(e.getMessage()));
        } finally {
            exchange.close();
        }
    }

    /**
     * Only requests addressed to localhost, so another site can't reach this by pointing its own name at 127.0.0.1,
     * and only POSTs with {@link #REQUEST_HEADER}.
     */
    private static boolean allowed(HttpExchange exchange) {
        String host = exchange.getRequestHeaders().getFirst("Host");
        boolean local = ("localhost:" + port).equals(host) || ("127.0.0.1:" + port).equals(host);
        boolean post = exchange.getRequestMethod().equals("POST");
        return local && (!post || exchange.getRequestHeaders().containsKey(REQUEST_HEADER));
    }

    /** {@code ?id=N&from=M}: the current run, with its output from line M on, or all of it if N isn't this run. */
    private static void status(HttpExchange exchange) throws IOException {
        Run run = currentRun();
        if (run == null) {
            send(exchange, 200, JSON, "{\"id\":null,\"running\":false}");
            return;
        }
        int id = -1;
        int from = 0;
        String query = exchange.getRequestURI().getQuery();
        for (String pair : query == null ? new String[0] : query.split("&")) {
            String[] parts = pair.split("=", 2);
            try {
                if (parts[0].equals("id")) {
                    id = Integer.parseInt(parts[1]);
                } else if (parts[0].equals("from")) {
                    from = Integer.parseInt(parts[1]);
                }
            } catch (NumberFormatException | ArrayIndexOutOfBoundsException e) {
                // Ignored: the run's whole output is sent.
            }
        }
        send(exchange, 200, JSON, run.status(id == run.id ? from : 0));
    }

    /** Starts QuickTestBurst with the request body's lines as its arguments, unless a run is already going. */
    private static void run(HttpExchange exchange) throws IOException {
        List<String> args = Arrays.stream(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8)
                .split("\r?\n")).filter(arg -> !arg.isEmpty()).toList();
        Run run;
        synchronized (QuickTestBurstUi.class) {
            if (current != null && current.process.isAlive()) {
                send(exchange, 409, "text/plain", "a run is already going; stop it first");
                return;
            }
            List<String> command = new ArrayList<>(List.of(
                    Path.of(System.getProperty("java.home"), "bin", "java").toString(), "-cp", classpath(),
                    QuickTestBurst.class.getName()));
            command.addAll(args);
            Process process = new ProcessBuilder(command).redirectErrorStream(true).start();
            run = new Run(++runCount, args, process);
            current = run;
        }
        Thread reader = new Thread(() -> readOutput(run), "quicktest-burst-output-" + run.id);
        reader.setDaemon(true);
        reader.start();
        System.out.println("run " + run.id + ": QuickTestBurst " + String.join(" ", args));
        send(exchange, 200, JSON, "{\"id\":" + run.id + "}");
    }

    private static void readOutput(Run run) {
        try (BufferedReader in = new BufferedReader(
                new InputStreamReader(run.process.getInputStream(), StandardCharsets.UTF_8))) {
            for (String line = in.readLine(); line != null; line = in.readLine()) {
                run.add(line);
            }
        } catch (IOException e) {
            run.add("(stopped reading output: " + e.getMessage() + ")");
        }
        try {
            run.finish(run.process.waitFor());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private static void stop(HttpExchange exchange) throws IOException {
        Run run = currentRun();
        if (run != null && run.process.isAlive()) {
            run.add("(stopped from the page)");
            run.process.destroy();
        }
        send(exchange, 200, JSON, "{}");
    }

    private static synchronized Run currentRun() {
        return current;
    }

    /**
     * The classpath this class came from, for the QuickTestBurst process. Under mvn exec:java that's the exec plugin's
     * class loader; java.class.path is Maven's own there.
     */
    private static String classpath() {
        if (QuickTestBurstUi.class.getClassLoader() instanceof URLClassLoader loader) {
            List<String> entries = new ArrayList<>();
            for (URL url : loader.getURLs()) {
                try {
                    entries.add(Path.of(url.toURI()).toString());
                } catch (URISyntaxException e) {
                    throw new IllegalStateException("can't use classpath entry " + url, e);
                }
            }
            return String.join(File.pathSeparator, entries);
        }
        return System.getProperty("java.class.path");
    }

    private static boolean isSet(String name) {
        String value = System.getenv(name);
        return value != null && !value.isBlank();
    }

    private static void send(HttpExchange exchange, int code, String contentType, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.getResponseHeaders().set("Cache-Control", "no-store");
        exchange.sendResponseHeaders(code, bytes.length);
        try (OutputStream out = exchange.getResponseBody()) {
            out.write(bytes);
        }
    }

    private static String json(List<String> values) {
        return values.stream().map(QuickTestBurstUi::json).collect(Collectors.joining(",", "[", "]"));
    }

    private static String json(String value) {
        StringBuilder out = new StringBuilder("\"");
        for (char c : value.toCharArray()) {
            switch (c) {
                case '"' -> out.append("\\\"");
                case '\\' -> out.append("\\\\");
                case '\n' -> out.append("\\n");
                case '\r' -> out.append("\\r");
                case '\t' -> out.append("\\t");
                default -> out.append(c < 0x20 ? String.format("\\u%04x", (int) c) : String.valueOf(c));
            }
        }
        return out.append('"').toString();
    }
}
