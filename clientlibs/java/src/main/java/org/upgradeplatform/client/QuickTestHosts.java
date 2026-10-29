package org.upgradeplatform.client;

/**
 * Base URLs for QuickTest and QuickTestBurst. Only localhost is in the code; the hosted environments' URLs come
 * from environment variables on your own machine so they stay out of this public repo:
 * <ul>
 * <li>{@code UPGRADE_QA_URL} for {@code qa}</li>
 * <li>{@code UPGRADE_STAGING_URL} for {@code staging}</li>
 * </ul>
 * Add these to your shell profile (e.g. {@code ~/.zshrc}), with each environment's backend base URL:
 *
 * <pre>
 * export UPGRADE_QA_URL=https://&lt;qa backend host&gt;
 * export UPGRADE_STAGING_URL=https://&lt;staging backend host&gt;
 * </pre>
 *
 * then open a new terminal (or {@code source ~/.zshrc}). An IDE reads your profile only when it starts, so restart it
 * before running from there. To skip the variables entirely, pass the base URL itself instead of an env name.
 * <p>
 * {@code local} is localhost on port 3030; {@code local:<port>} (e.g. {@code local:3031}) uses another port, such as a
 * worktree's backend.
 */
final class QuickTestHosts {
    static final String LOCAL_URL = localUrl(3030);

    private static final String LOCAL_WITH_PORT = "local:";

    private QuickTestHosts() {
    }

    /**
     * The base URL for {@code local}, {@code local:<port>}, {@code qa} or {@code staging}; throws with a usable message
     * otherwise.
     */
    static String forEnv(String env) {
        if (env.startsWith(LOCAL_WITH_PORT)) {
            return localUrl(parsePort(env.substring(LOCAL_WITH_PORT.length())));
        }
        return switch (env) {
            case "local" -> LOCAL_URL;
            case "qa" -> requireEnv("UPGRADE_QA_URL");
            case "staging" -> requireEnv("UPGRADE_STAGING_URL");
            default -> throw new IllegalArgumentException("unknown env " + env + " (local, local:<port>, qa, staging)");
        };
    }

    private static String localUrl(int port) {
        return "http://localhost:" + port;
    }

    private static int parsePort(String value) {
        int port;
        try {
            port = Integer.parseInt(value);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("port must be a number, got " + value);
        }
        if (port < 1 || port > 65535) {
            throw new IllegalArgumentException("port must be 1-65535, got " + port);
        }
        return port;
    }

    private static String requireEnv(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(name + " is not set; export it with that environment's base URL");
        }
        return value;
    }
}
