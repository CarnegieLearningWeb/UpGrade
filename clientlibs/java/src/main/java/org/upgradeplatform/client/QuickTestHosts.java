package org.upgradeplatform.client;

/**
 * Base URLs for QuickTest and QuickTestBurst. Only localhost is in the code; the hosted environments' URLs come
 * from environment variables so they stay out of this public repo:
 * <ul>
 * <li>{@code UPGRADE_QA_URL} for {@code qa}</li>
 * <li>{@code UPGRADE_STAGING_URL} for {@code staging}</li>
 * </ul>
 * e.g. {@code export UPGRADE_QA_URL=https://...} in your shell profile.
 */
final class QuickTestHosts {
    static final String LOCAL_URL = "http://localhost:3030";

    private QuickTestHosts() {
    }

    /** The base URL for {@code local}, {@code qa} or {@code staging}; throws with a usable message otherwise. */
    static String forEnv(String env) {
        return switch (env) {
            case "local" -> LOCAL_URL;
            case "qa" -> requireEnv("UPGRADE_QA_URL");
            case "staging" -> requireEnv("UPGRADE_STAGING_URL");
            default -> throw new IllegalArgumentException("unknown env " + env + " (local, qa, staging)");
        };
    }

    private static String requireEnv(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(name + " is not set; export it with that environment's base URL");
        }
        return value;
    }
}
