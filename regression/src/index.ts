import { ExcludeIfReachedTests } from "./ExcludeIfReachedTests";
import { env } from "./env";

const excludeIfReachedSuite = new ExcludeIfReachedTests(env.local);

excludeIfReachedSuite.run();
