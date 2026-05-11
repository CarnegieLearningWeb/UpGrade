// ---------------------------------------------------------------------------
// Usage:
//   yarn looper --looper <name>          # run tests/name.looper.ts
//   yarn looper --looper <name> --no-log # skip writing a combined log
//
// Looper files live in quicktest/tests/ with a .looper.ts extension.
// They are gitignored (same as .quicktest files).
//
// Example looper file (tests/my-sequence.looper.ts):
//   import type { LooperConfig } from '../looper';
//   export default {
//     runs: 3,                              // optional, default 1
//     sequence: ['local-failure', 'local-success'],  // .quicktest or .looper.ts names
//   } satisfies LooperConfig;
//
// Sequences may reference other .looper.ts files — they are expanded inline,
// including their own runs multiplier.
// ---------------------------------------------------------------------------

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { parseArgs } from 'util';

export interface LooperConfig {
  runs?: number;
  sequence: string[];
}

const { values: args } = parseArgs({
  args: process.argv.slice(2),
  options: {
    looper: { type: 'string' },
    'no-log': { type: 'boolean', default: false },
  },
});

const testsDir = path.resolve(__dirname, 'tests');
const tsNode = path.resolve(__dirname, '../node_modules/.bin/ts-node');
const quickTestScript = path.resolve(__dirname, 'quickTest.ts');

/** Recursively expand a list of names into an ordered list of quicktest config names. */
function resolveSequence(names: string[]): string[] {
  const resolved: string[] = [];
  for (const name of names) {
    const looperPath = path.join(testsDir, `${name}.looper.ts`);
    const quicktestPath = path.join(testsDir, `${name}.quicktest`);
    if (fs.existsSync(looperPath)) {
      const nested = require(looperPath).default as LooperConfig;
      const nestedSteps = resolveSequence(nested.sequence);
      const runs = nested.runs ?? 1;
      for (let r = 0; r < runs; r++) resolved.push(...nestedSteps);
    } else if (fs.existsSync(quicktestPath)) {
      resolved.push(name);
    } else {
      console.warn(`[Looper] "${name}" not found as .quicktest or .looper.ts — skipping`);
    }
  }
  return resolved;
}

/** Run one quicktest config as a subprocess, teeing output to logStream in real time. */
function runStep(configName: string, logStream: fs.WriteStream | null): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(tsNode, [quickTestScript, '--config', configName, '--no-log'], {
      stdio: ['inherit', 'pipe', 'pipe'],
      cwd: path.resolve(__dirname, '..'),
    });
    const write = (data: Buffer) => {
      process.stdout.write(data);
      logStream?.write(data);
    };
    child.stdout.on('data', write);
    child.stderr.on('data', write);
    child.on('close', (code) => resolve(code ?? 0));
  });
}

(async () => {
  if (!args.looper) {
    console.error('[Looper] --looper <name> is required');
    process.exit(1);
  }

  const looperName = args.looper as string;
  const looperPath = path.join(testsDir, `${looperName}.looper.ts`);

  if (!fs.existsSync(looperPath)) {
    console.error(`[Looper] Config not found: ${looperPath}`);
    process.exit(1);
  }

  const config = require(looperPath).default as LooperConfig;
  const runs = config.runs ?? 1;
  const resolvedOnce = resolveSequence(config.sequence);
  const allSteps: string[] = [];
  for (let r = 0; r < runs; r++) allSteps.push(...resolvedOnce);

  const stepSummary = allSteps.join(', ');
  console.log(`\n[Looper] ${looperName} | ${allSteps.length} step(s): ${stepSummary}`);

  let logStream: fs.WriteStream | null = null;
  if (!args['no-log']) {
    const runlogsDir = path.resolve(__dirname, 'runlogs');
    if (!fs.existsSync(runlogsDir)) fs.mkdirSync(runlogsDir);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const logPath = path.join(runlogsDir, `${timestamp}_${looperName}.log`);
    logStream = fs.createWriteStream(logPath);
    const header = `=== Looper: ${looperName} | runs: ${runs} | sequence: ${stepSummary} ===\n\n`;
    logStream.write(header);
    console.log(`[Log] ${logPath}`);
  }

  let failures = 0;
  for (let i = 0; i < allSteps.length; i++) {
    const configName = allSteps[i];
    const stepLine = `\n========== Step ${i + 1} / ${allSteps.length}: ${configName} ==========\n`;
    process.stdout.write(stepLine);
    logStream?.write(stepLine);
    const exitCode = await runStep(configName, logStream);
    if (exitCode !== 0) {
      const msg = `[Looper] Step ${i + 1} (${configName}) exited with code ${exitCode}\n`;
      process.stderr.write(msg);
      logStream?.write(msg);
      failures++;
    }
  }

  const done = `\n[Looper] Done. ${failures > 0 ? `${failures} step(s) failed.` : 'All steps passed.'}\n`;
  process.stdout.write(done);
  logStream?.write(done);
  logStream?.end();

  process.exit(failures > 0 ? 1 : 0);
})();
