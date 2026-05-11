import axios from 'axios';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import prompts from 'prompts';
import { QUICKTEST_DEFAULTS } from './runner.config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContextMetadataResponse {
  contextMetadata: Record<
    string,
    {
      CONDITIONS?: string[];
      GROUP_TYPES?: string[];
      EXP_IDS?: string[];
      EXP_POINTS?: string[];
    }
  >;
}

interface Experiment {
  id: string;
  name: string;
  context?: string[];
  queries?: Array<{ metric: { key: string } }>;
  [key: string]: unknown;
}

interface ApiMetricUnit {
  key: string;
  allowedData?: string[];
  context?: string[];
  children?: ApiMetricUnit[];
}

interface LogMetricValue {
  key: string;
  value: string;
}

type GenerateTemplate = 'random' | 'minimal-simple' | 'minimal-adaptive' | 'full';

interface GenerateParams {
  site: string;
  target: string;
  conditions: string[];
}

type ExperimentSetup =
  | { type: 'none' }
  | { type: 'existing'; id: string; name: string }
  | { type: 'generate'; template: GenerateTemplate; params: GenerateParams };

// key = groupType (e.g. "classId"), value = list of IDs for that type
type UserGroups = Record<string, string[]>;

interface WorkingGroup {
  groupType: string;
  groupId: string;
}

type UserIdMode = 'RANDOM_EVERY_SESSION_LOOP' | 'RANDOM_SAME_FOR_ALL_LOOPS' | 'SPECIFIED_USER_SAME_ALL_LOOPS';

interface UserSetup {
  userIdMode: UserIdMode;
  specifiedUserId: string | null;
  groups: UserGroups;
  workingGroup: WorkingGroup | null;
}

interface WizardResult {
  configName: string;
  hostUrl: string;
  adminApiToken: string;
  context: string;
  sessionLoops: number;
  user: UserSetup;
  experiment: ExperimentSetup;
  script: string[];
  logMetrics: LogMetricValue[];
}

type ListKind = 'individual' | 'groupType' | 'segment';

interface ListSpec {
  kind: ListKind;
  groupType?: string;
  ids: string[];
  name: string;
}

interface ParticipantSetup {
  filterMode: 'includeAll' | 'excludeAll';
  inclusionLists: ListSpec[];
  exclusionLists: ListSpec[];
}

const SCRIPT_FUNCTIONS = [
  'doInit',
  'doGroupMembership',
  'doWorkingGroupMembership',
  'doAliases',
  'doAssignIgnoreCache',
  'doGetDecisionPointAssignment',
  'doMark',
  'doLog',
  'doSendRewardByExperimentId',
  'doSendRewardByDecisionPoint',
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function authHeaders(token: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchContextMetadata(hostUrl: string, token: string): Promise<Record<string, unknown>> {
  try {
    const { data } = await axios.get<ContextMetadataResponse>(`${hostUrl}/api/experiments/contextMetaData`, {
      timeout: 5000,
      headers: authHeaders(token),
    });
    return data.contextMetadata ?? {};
  } catch (error) {
    console.warn('\n  [Wizard] Could not fetch context metadata — proceeding with defaults only.\n');
    console.warn(error);
    return {};
  }
}

async function fetchMetrics(hostUrl: string, context: string, token: string): Promise<string[]> {
  try {
    const url = context
      ? `${hostUrl}/api/metric/${encodeURIComponent(context)}`
      : `${hostUrl}/api/metric`;
    const { data } = await axios.get<ApiMetricUnit[]>(url, { timeout: 5000, headers: authHeaders(token) });
    return flattenMetricTree(Array.isArray(data) ? data : []);
  } catch {
    console.warn('\n  [Wizard] Could not fetch metrics — proceeding with empty list.\n');
    return [];
  }
}

function flattenMetricTree(units: ApiMetricUnit[], prefix: string[] = []): string[] {
  const keys: string[] = [];
  for (const unit of units) {
    const path = [...prefix, unit.key];
    if (unit.children && unit.children.length > 0) {
      keys.push(...flattenMetricTree(unit.children, path));
    } else {
      keys.push(path.join('@__@'));
    }
  }
  return keys;
}

async function fetchExperiments(hostUrl: string, context: string, token: string): Promise<Experiment[]> {
  try {
    const { data } = await axios.get<Experiment[]>(`${hostUrl}/api/experiments`, {
      timeout: 5000,
      headers: authHeaders(token),
    });
    const all: Experiment[] = Array.isArray(data) ? data : [];
    return context ? all.filter((e) => e.context?.includes(context)) : all;
  } catch {
    console.warn('\n  [Wizard] Could not fetch experiments.\n');
    return [];
  }
}

function toConfigName(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, '_');
}

function randomSlug(): string {
  return Math.random().toString(36).slice(2, 8);
}

/** Parse a comma-or-space separated string into a trimmed list of non-empty strings. */
function parseIds(input: string): string[] {
  return input
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Print a compact status line showing the user built so far. */
function printUserStatus(userIdDisplay: string, groups: UserGroups) {
  const groupParts = Object.entries(groups)
    .map(([type, ids]) => `${type}: [${ids.join(', ')}]`)
    .join('  ');
  console.log(`\n  userId: ${userIdDisplay}  |  groups: ${groupParts || '(none)'}\n`);
}

// ---------------------------------------------------------------------------
// User sub-wizard
// ---------------------------------------------------------------------------

async function promptUser(contextGroupTypes: string[], sessionLoops: number): Promise<UserSetup | null> {
  // ── userId mode ─────────────────────────────────────────────────────────
  const modeChoices: prompts.Choice[] =
    sessionLoops > 1
      ? [
          { title: 'Random — new user ID on each loop', value: 'RANDOM_EVERY_SESSION_LOOP' },
          { title: 'Random — one new user ID shared across all loops', value: 'RANDOM_SAME_FOR_ALL_LOOPS' },
          { title: 'Specify user ID', value: 'SPECIFIED_USER_SAME_ALL_LOOPS' },
        ]
      : [
          { title: 'Random — generate a new user ID every test-run', value: 'RANDOM_EVERY_SESSION_LOOP' },
          { title: 'Specify user ID', value: 'SPECIFIED_USER_SAME_ALL_LOOPS' },
        ];

  const { userIdMode } = await prompts({
    type: 'select',
    name: 'userIdMode',
    message: 'User ID strategy?',
    choices: modeChoices,
    initial: 0,
  });

  if (userIdMode === undefined) return null;

  let specifiedUserId: string | null = null;

  if (userIdMode === 'SPECIFIED_USER_SAME_ALL_LOOPS') {
    const defaultUserId = `quicktest_user_${randomSlug()}`;
    const { typedId } = await prompts({
      type: 'text',
      name: 'typedId',
      message: 'User ID?',
      initial: defaultUserId,
      hint: '(leave as-is to use this generated placeholder)',
    });
    if (typedId === undefined) return null;
    specifiedUserId = typedId.trim() || defaultUserId;
  }

  const userIdDisplay =
    userIdMode === 'SPECIFIED_USER_SAME_ALL_LOOPS'
      ? specifiedUserId ?? ''
      : userIdMode === 'RANDOM_EVERY_SESSION_LOOP'
      ? '(random each loop)'
      : '(random, same for all loops)';

  // ── group membership loop ───────────────────────────────────────────────
  const groups: UserGroups = {};

  for (;;) {
    printUserStatus(userIdDisplay, groups);

    const groupTypeChoices: prompts.Choice[] = [
      { title: 'No  (done adding groups)', value: '__no__' },
      ...contextGroupTypes.map((gt) => ({ title: gt, value: gt })),
      { title: 'Custom  (enter group type manually)', value: '__custom__' },
    ];

    const { groupPick } = await prompts({
      type: 'select',
      name: 'groupPick',
      message: 'Add user group?',
      choices: groupTypeChoices,
      initial: 0,
    });

    if (groupPick === undefined || groupPick === '__no__') break;

    let groupType: string;
    if (groupPick === '__custom__') {
      const { customType } = await prompts({
        type: 'text',
        name: 'customType',
        message: 'Group type name?',
        validate: (v) => (v.trim().length > 0 ? true : 'Cannot be empty'),
      });
      if (customType === undefined) return null;
      groupType = customType.trim();
    } else {
      groupType = groupPick;
    }

    const { rawIds } = await prompts({
      type: 'text',
      name: 'rawIds',
      message: `IDs for "${groupType}"?  (comma or space separated)`,
      validate: (v) => (parseIds(v).length > 0 ? true : 'Enter at least one ID'),
    });

    if (rawIds === undefined) return null;

    const ids = parseIds(rawIds);
    // merge with any already-defined ids for this type
    groups[groupType] = [...(groups[groupType] ?? []), ...ids];
  }

  // ── working group ───────────────────────────────────────────────────────
  const definedTypes = Object.keys(groups);
  let workingGroup: WorkingGroup | null = null;

  if (definedTypes.length > 0) {
    printUserStatus(userIdDisplay, groups);

    const workingGroupChoices: prompts.Choice[] = [
      { title: 'None', value: '__none__' },
      ...definedTypes.map((gt) => ({ title: gt, value: gt })),
      { title: 'Custom  (enter manually)', value: '__custom__' },
    ];

    const { wgPick } = await prompts({
      type: 'select',
      name: 'wgPick',
      message: 'Set working group?',
      choices: workingGroupChoices,
      initial: 0,
    });

    if (wgPick === undefined) return null;

    if (wgPick === '__none__') {
      workingGroup = null;
    } else if (wgPick === '__custom__') {
      const wgAnswers = await prompts([
        {
          type: 'text',
          name: 'customType',
          message: 'Working group type?',
          validate: (v) => (v.trim().length > 0 ? true : 'Cannot be empty'),
        },
        {
          type: 'text',
          name: 'customId',
          message: 'Working group ID?  (one only)',
          validate: (v) => (v.trim().length > 0 ? true : 'Cannot be empty'),
        },
      ]);
      if (wgAnswers.customType === undefined || wgAnswers.customId === undefined) return null;
      workingGroup = { groupType: wgAnswers.customType.trim(), groupId: wgAnswers.customId.trim() };
    } else {
      // wgPick is a known group type — pick one ID from it
      const idsForType = groups[wgPick];

      let resolvedId: string;
      if (idsForType.length === 1) {
        resolvedId = idsForType[0];
        console.log(`  → Auto-selected only ID for "${wgPick}": ${resolvedId}`);
      } else {
        const { pickedId } = await prompts({
          type: 'select',
          name: 'pickedId',
          message: `Which "${wgPick}" ID for working group?`,
          choices: idsForType.map((id) => ({ title: id, value: id })),
          initial: 0,
        });
        if (pickedId === undefined) return null;
        resolvedId = pickedId;
      }

      workingGroup = { groupType: wgPick, groupId: resolvedId };
    }
  }

  return { userIdMode, specifiedUserId, groups, workingGroup };
}

// ---------------------------------------------------------------------------
// Script sub-wizard
// ---------------------------------------------------------------------------

const SCRIPT_DONE = '__done__' as const;
type ScriptChoice = typeof SCRIPT_DONE | (typeof SCRIPT_FUNCTIONS)[number];

async function promptScript(): Promise<string[] | null> {
  const choices: ScriptChoice[] = [SCRIPT_DONE, ...SCRIPT_FUNCTIONS];
  const script: string[] = [];
  let cursor = 0;

  const termCols = process.stdout.columns ?? 80;
  const COL_W = 33;
  const numCols = Math.max(1, Math.floor(termCols / COL_W));
  const numRows = Math.ceil(choices.length / numCols);
  let drawnLines = 0;

  function render() {
    if (drawnLines > 0) process.stdout.write(`\x1b[${drawnLines}A\x1b[0J`);

    const scriptStr = script.length > 0 ? script.map((f, i) => `${i + 1}. ${f}`).join(' → ') : '(empty)';

    const out: string[] = ['', `  User Session Script: ${scriptStr}`, ''];

    for (let r = 0; r < numRows; r++) {
      let row = '  ';
      for (let c = 0; c < numCols; c++) {
        const idx = r * numCols + c;
        if (idx >= choices.length) break;
        const ch = choices[idx];
        const label = ch === SCRIPT_DONE ? '✓ Done' : ch;
        const isSelected = idx === cursor;
        const isDone = ch === SCRIPT_DONE;
        const cell = ` ${label} `;
        const pad = ' '.repeat(Math.max(0, COL_W - cell.length));
        if (isSelected && isDone) row += `\x1b[32;7m${cell}\x1b[0m${pad}`;
        else if (isSelected) row += `\x1b[7m${cell}\x1b[0m${pad}`;
        else if (isDone) row += `\x1b[32m${cell}\x1b[0m${pad}`;
        else row += cell + pad;
      }
      out.push(row);
    }

    out.push('', '  ↑↓←→ navigate    Space/Enter: add step    Backspace: undo last');
    process.stdout.write(out.join('\n') + '\n');
    drawnLines = out.length;
  }

  return new Promise((resolve) => {
    process.stdout.write('\x1b[?25l'); // hide cursor
    render();

    function finish(result: string[] | null) {
      if (drawnLines > 0) process.stdout.write(`\x1b[${drawnLines}A\x1b[0J`);
      process.stdout.write('\x1b[?25h'); // show cursor
      const stdinTTY = process.stdin as NodeJS.ReadStream;
      if (stdinTTY.isTTY) stdinTTY.setRawMode(false);
      process.stdin.removeListener('data', onKey);
      process.stdin.pause();
      if (result !== null) {
        const display = result.length > 0 ? result.map((f, i) => `${i + 1}. ${f}`).join(' → ') : '(empty)';
        process.stdout.write(`\n  User Session Script: ${display}\n\n`);
      }
      resolve(result);
    }

    function onKey(key: string) {
      switch (key) {
        case '\x03': // Ctrl+C
          finish(null);
          break;
        case '\x1b': // Escape → done
          finish(script);
          break;
        case '\r':
        case ' ': {
          const ch = choices[cursor];
          if (ch === SCRIPT_DONE) finish(script);
          else {
            script.push(ch);
            render();
          }
          break;
        }
        case '\x7f':
        case '\x08':
          if (script.length > 0) {
            script.pop();
            render();
          }
          break;
        case '\x1b[A':
          cursor = Math.max(0, cursor - numCols);
          render();
          break;
        case '\x1b[B':
          cursor = Math.min(choices.length - 1, cursor + numCols);
          render();
          break;
        case '\x1b[D':
          cursor = Math.max(0, cursor - 1);
          render();
          break;
        case '\x1b[C':
          cursor = Math.min(choices.length - 1, cursor + 1);
          render();
          break;
      }
    }

    const stdinTTY = process.stdin as NodeJS.ReadStream;
    if (stdinTTY.isTTY) stdinTTY.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', onKey);
  });
}

// ---------------------------------------------------------------------------
// Generate sub-wizard
// ---------------------------------------------------------------------------

async function promptGenerate(): Promise<ExperimentSetup | null> {
  const { template } = await prompts({
    type: 'select',
    name: 'template',
    message: 'Generate template?',
    choices: [
      { title: 'Random        — all fake values, fully auto-generated', value: 'random' },
      { title: 'Minimal Simple — you define site, target, and conditions', value: 'minimal-simple' },
      { title: 'Minimal Adaptive — (coming soon)', value: 'minimal-adaptive', disabled: true },
      { title: 'Full             — (coming soon)', value: 'full', disabled: true },
    ],
    initial: 0,
  });

  if (template === undefined) return null;

  if (template === 'random') {
    return {
      type: 'generate',
      template: 'random',
      params: {
        site: `site_${randomSlug()}`,
        target: `target_${randomSlug()}`,
        conditions: ['control', 'variant'],
      },
    };
  }

  if (template === 'minimal-simple') {
    const answers = await prompts([
      { type: 'text', name: 'site', message: 'Site?', initial: 'fakesite' },
      { type: 'text', name: 'target', message: 'Target?', initial: 'faketarget' },
      {
        type: 'text',
        name: 'rawConditions',
        message: 'Condition names?  (comma-separated)',
        initial: 'control, variant',
        format: (v: string) =>
          v
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean),
      },
    ]);

    if (answers.site === undefined || answers.target === undefined) return null;

    return {
      type: 'generate',
      template: 'minimal-simple',
      params: {
        site: answers.site.trim() || 'fakesite',
        target: answers.target.trim() || 'faketarget',
        conditions:
          (answers.rawConditions as string[]).length > 0 ? (answers.rawConditions as string[]) : ['control', 'variant'],
      },
    };
  }

  // stubs — not reachable while disabled
  console.log('\n  That template is not yet implemented.\n');
  return null;
}

// ---------------------------------------------------------------------------
// Condition payload sub-wizard
// ---------------------------------------------------------------------------

async function promptConditionPayloads(conditions: string[]): Promise<Record<string, string> | null> {
  const { addPayloads } = await prompts({
    type: 'confirm',
    name: 'addPayloads',
    message: 'Add payloads to conditions?',
    initial: false,
  });

  if (addPayloads === undefined) return null;
  if (!addPayloads) return {};

  const payloads: Record<string, string> = {};
  for (const code of conditions) {
    const { value } = await prompts({
      type: 'text',
      name: 'value',
      message: `Payload for "${code}"?  (leave blank for none)`,
      initial: '',
    });
    if (value === undefined) return null;
    if (value.trim()) payloads[code] = value.trim();
  }
  return payloads;
}

// ---------------------------------------------------------------------------
// Participant list sub-wizard
// ---------------------------------------------------------------------------

async function promptListLoop(
  role: 'inclusion' | 'exclusion',
  contextGroupTypes: string[]
): Promise<ListSpec[] | null> {
  const lists: ListSpec[] = [];

  for (;;) {
    const count = lists.length + 1;
    const doneLabel = lists.length === 0 ? `No ${role} lists  (skip)` : `Done — no more ${role} lists`;

    const { kind } = await prompts({
      type: 'select',
      name: 'kind',
      message: lists.length === 0 ? `Add ${role} list?` : `Add another ${role} list?`,
      choices: [
        { title: doneLabel, value: '__done__' },
        { title: 'Individual  (user IDs)', value: 'individual' },
        { title: 'Group type  (group IDs by type)', value: 'groupType' },
        { title: 'Segment  (coming soon)', value: 'segment', disabled: true },
      ],
      initial: 0,
    });

    if (kind === undefined) return null;
    if (kind === '__done__') break;

    let spec: ListSpec | null = null;

    if (kind === 'individual') {
      const { rawIds } = await prompts({
        type: 'text',
        name: 'rawIds',
        message: 'User IDs?  (comma or space separated)',
        validate: (v) => (parseIds(v).length > 0 ? true : 'Enter at least one ID'),
      });
      if (rawIds === undefined) return null;
      spec = { kind: 'individual', ids: parseIds(rawIds), name: `quicktest-${role}-individual-${count}` };
    } else if (kind === 'groupType') {
      let groupType: string;

      if (contextGroupTypes.length > 0) {
        const { groupTypePick } = await prompts({
          type: 'select',
          name: 'groupTypePick',
          message: 'Group type?',
          choices: [
            ...contextGroupTypes.map((gt) => ({ title: gt, value: gt })),
            { title: 'Custom  (enter manually)', value: '__custom__' },
          ],
          initial: 0,
        });
        if (groupTypePick === undefined) return null;

        if (groupTypePick === '__custom__') {
          const { customType } = await prompts({
            type: 'text',
            name: 'customType',
            message: 'Group type name?',
            validate: (v) => (v.trim().length > 0 ? true : 'Cannot be empty'),
          });
          if (customType === undefined) return null;
          groupType = customType.trim();
        } else {
          groupType = groupTypePick;
        }
      } else {
        const { customType } = await prompts({
          type: 'text',
          name: 'customType',
          message: 'Group type name?',
          validate: (v) => (v.trim().length > 0 ? true : 'Cannot be empty'),
        });
        if (customType === undefined) return null;
        groupType = customType.trim();
      }

      const { rawIds } = await prompts({
        type: 'text',
        name: 'rawIds',
        message: `Group IDs for "${groupType}"?  (comma or space separated)`,
        validate: (v) => (parseIds(v).length > 0 ? true : 'Enter at least one ID'),
      });
      if (rawIds === undefined) return null;
      spec = { kind: 'groupType', groupType, ids: parseIds(rawIds), name: `quicktest-${role}-${groupType}-${count}` };
    }

    if (spec) {
      lists.push(spec);
      const desc =
        spec.kind === 'individual'
          ? `${spec.ids.length} user(s)`
          : `${spec.ids.length} group(s) of type "${spec.groupType}"`;
      console.log(`  → Added ${role} list: "${spec.name}"  (${desc})`);
    }
  }

  return lists;
}

async function promptParticipantLists(context: string, contextGroupTypes: string[]): Promise<ParticipantSetup | null> {
  const { mode } = await prompts({
    type: 'select',
    name: 'mode',
    message: 'Participant filtering?',
    choices: [
      { title: 'Include all  (default)', value: 'includeAll' },
      { title: 'Create inclusion list(s)', value: 'createLists' },
    ],
    initial: 0,
  });

  if (mode === undefined) return null;

  const filterMode: 'includeAll' | 'excludeAll' = mode === 'createLists' ? 'excludeAll' : 'includeAll';
  let inclusionLists: ListSpec[] = [];

  if (mode === 'createLists') {
    const result = await promptListLoop('inclusion', contextGroupTypes);
    if (result === null) return null;
    inclusionLists = result;
  }

  // Exclusion lists are always applicable regardless of filterMode
  const exclusionLists = await promptListLoop('exclusion', contextGroupTypes);
  if (exclusionLists === null) return null;

  return { filterMode, inclusionLists, exclusionLists };
}

// ---------------------------------------------------------------------------
// Participant list API helper
// ---------------------------------------------------------------------------

async function createParticipantList(
  hostUrl: string,
  token: string,
  endpoint: 'inclusionList' | 'exclusionList',
  experimentId: string,
  list: ListSpec,
  context: string
): Promise<void> {
  const body = {
    experimentId,
    list: {
      name: list.name,
      context,
      type: 'private',
      userIds: list.kind === 'individual' ? list.ids : [],
      groups: list.kind === 'groupType' ? list.ids.map((id) => ({ groupId: id, type: list.groupType! })) : [],
      subSegmentIds: [] as string[],
    },
  };
  try {
    await axios.post(`${hostUrl}/api/experiments/${endpoint}`, body, { headers: authHeaders(token) });
    console.log(`  [${endpoint}] "${list.name}" — OK`);
  } catch (error) {
    console.error(`  [${endpoint}] Failed for "${list.name}"`);
    if (axios.isAxiosError(error)) {
      console.error(`    Status:  ${error.response?.status}`);
      console.error(`    Message: ${error.message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Log metrics sub-wizard
// ---------------------------------------------------------------------------

async function promptLogMetrics(
  hostUrl: string,
  token: string,
  context: string,
  experiment: ExperimentSetup,
  experiments: Experiment[]
): Promise<LogMetricValue[] | null> {
  console.log('\n  Fetching metrics for context...');
  const allKeys = await fetchMetrics(hostUrl, context, token);

  const relevantKeys = new Set<string>();
  if (experiment.type === 'existing') {
    const fullExp = experiments.find((e) => e.id === experiment.id);
    for (const q of fullExp?.queries ?? []) {
      if (q?.metric?.key) relevantKeys.add(q.metric.key);
    }
  }

  const sorted = [
    ...allKeys.filter((k) => relevantKeys.has(k)),
    ...allKeys.filter((k) => !relevantKeys.has(k)).sort(),
  ];

  const collected: LogMetricValue[] = [];

  for (;;) {
    if (collected.length > 0) {
      console.log('\n  Metrics to log:');
      for (const m of collected) {
        console.log(`    ${m.key}: ${m.value}`);
      }
    }

    const metricChoices: prompts.Choice[] = [
      {
        title: collected.length === 0 ? 'No metrics  (skip doLog at runtime)' : 'Done — no more metrics',
        value: '__done__',
      },
      ...sorted.map((k) => ({
        title: relevantKeys.has(k) ? `★  ${k}` : `   ${k}`,
        value: k,
      })),
    ];

    const { metricKey } = await prompts({
      type: 'select',
      name: 'metricKey',
      message: collected.length === 0 ? 'Add a metric to log?' : 'Add another metric?',
      choices: metricChoices,
      initial: 0,
    });

    if (metricKey === undefined || metricKey === '__done__') break;

    const { value } = await prompts({
      type: 'text',
      name: 'value',
      message: `Value for "${metricKey}"?`,
      validate: (v: string) => (v.trim().length > 0 ? true : 'Enter a value'),
    });

    if (value === undefined) return null;
    collected.push({ key: metricKey, value: value.trim() });
  }

  return collected;
}

// ---------------------------------------------------------------------------
// Create-experiment flow
// ---------------------------------------------------------------------------

async function runCreateExperiment(): Promise<void> {
  console.log('\n=== Create Experiment ===\n');

  // ── Host URL ────────────────────────────────────────────────────────────
  const { hostUrl } = await prompts({
    type: 'select',
    name: 'hostUrl',
    message: 'Host URL?',
    choices: QUICKTEST_DEFAULTS.hostUrls.map((url, i) => ({
      title: i === 0 ? `${url}  (default)` : url,
      value: url,
    })),
    initial: 0,
  });
  if (!hostUrl) return aborted();

  // ── Admin token ─────────────────────────────────────────────────────────
  const adminApiToken = await promptAdminToken(hostUrl);
  if (adminApiToken === undefined) return aborted();

  // ── Context ─────────────────────────────────────────────────────────────
  console.log('\n  Fetching available contexts...');
  const contextMetadata = await fetchContextMetadata(hostUrl, adminApiToken);
  const availableContexts = Object.keys(contextMetadata);

  const contextChoices: prompts.Choice[] = [
    { title: `Default  (${QUICKTEST_DEFAULTS.defaultContext})`, value: '__default__' },
    ...availableContexts.map((c) => ({ title: c, value: c })),
    { title: 'Other  (enter manually)', value: '__other__' },
  ];

  const { rawContext } = await prompts({
    type: 'select',
    name: 'rawContext',
    message: 'App Context?',
    choices: contextChoices,
    initial: 0,
  });
  if (rawContext === undefined) return aborted();

  let context: string;
  if (rawContext === '__default__') {
    context = QUICKTEST_DEFAULTS.defaultContext;
  } else if (rawContext === '__other__') {
    const { customContext } = await prompts({
      type: 'text',
      name: 'customContext',
      message: 'Enter context name:',
      validate: (v) => (v.trim().length > 0 ? true : 'Context cannot be empty'),
    });
    if (customContext === undefined) return aborted();
    context = customContext.trim();
  } else {
    context = rawContext;
  }

  const contextEntry = (contextMetadata as ContextMetadataResponse['contextMetadata'])[context];
  const contextGroupTypes: string[] = contextEntry?.GROUP_TYPES ?? [];

  // ── Experiment params ───────────────────────────────────────────────────
  const generated = await promptGenerate();
  if (!generated || generated.type !== 'generate') return aborted();

  const { template, params } = generated;
  const { site, target, conditions } = params;
  const weight = parseFloat((100 / conditions.length).toFixed(4));

  // ── Condition payloads (minimal-simple only; random assumes defaults) ────
  let conditionPayloads: Record<string, string> = {};
  if (template !== 'random') {
    const payloads = await promptConditionPayloads(conditions);
    if (payloads === null) return aborted();
    conditionPayloads = payloads;
  }

  // ── Participant lists ────────────────────────────────────────────────────
  const participantSetup = await promptParticipantLists(context, contextGroupTypes);
  if (participantSetup === null) return aborted();

  // ── Confirm ─────────────────────────────────────────────────────────────
  console.log('\n  About to create:');
  console.log(`    Host:        ${hostUrl}`);
  console.log(`    Context:     ${context}`);
  console.log(`    Site:        ${site}`);
  console.log(`    Target:      ${target}`);
  console.log(`    Conditions:  ${conditions.join(', ')}`);
  if (Object.keys(conditionPayloads).length > 0) {
    console.log(
      `    Payloads:    ${Object.entries(conditionPayloads)
        .map(([k, v]) => `${k}="${v}"`)
        .join('  ')}`
    );
  }
  console.log(`    Filter mode: ${participantSetup.filterMode}`);
  if (participantSetup.inclusionLists.length > 0) {
    console.log(`    Inclusion:   ${participantSetup.inclusionLists.map((l) => l.name).join(', ')}`);
  }
  if (participantSetup.exclusionLists.length > 0) {
    console.log(`    Exclusion:   ${participantSetup.exclusionLists.map((l) => l.name).join(', ')}`);
  }
  console.log('');

  const { confirm } = await prompts({ type: 'confirm', name: 'confirm', message: 'Create?', initial: true });
  if (!confirm) {
    console.log('\n  Cancelled.\n');
    return;
  }

  // ── API call ────────────────────────────────────────────────────────────
  try {
    const { data } = await axios.post(
      `${hostUrl}/api/experiments`,
      {
        name: `quicktest-${randomSlug()}`,
        context: [context],
        state: 'enrolling',
        assignmentUnit: 'individual',
        consistencyRule: 'individual',
        postExperimentRule: 'continue',
        filterMode: participantSetup.filterMode,
        type: 'Simple',
        tags: ['quicktest'],
        conditions: conditions.map((code) => ({
          conditionCode: code,
          assignmentWeight: weight,
          description: '',
          ...(conditionPayloads[code] ? { payload: { type: 'string', value: conditionPayloads[code] } } : {}),
        })),
        partitions: [{ site, target, excludeIfReached: false }],
      },
      { headers: authHeaders(adminApiToken) }
    );
    console.log(`\n  Experiment created.`);
    console.log(`    ID:   ${data?.id}`);
    console.log(`    Name: ${data?.name}`);

    for (const list of participantSetup.inclusionLists) {
      await createParticipantList(hostUrl, adminApiToken, 'inclusionList', data.id, list, context);
    }
    for (const list of participantSetup.exclusionLists) {
      await createParticipantList(hostUrl, adminApiToken, 'exclusionList', data.id, list, context);
    }

    console.log(`\n  To use it: set EXPERIMENT_ID=${data?.id} in your config file.\n`);
  } catch (error) {
    console.error('\n  [Create] Failed to create experiment.');
    if (axios.isAxiosError(error)) {
      console.error(`  Status:  ${error.response?.status}`);
      console.error(`  Message: ${error.message}`);
      if (error.response?.data) {
        const body = error.response.data;
        const reason =
          typeof body === 'string' ? body : (body as Record<string, unknown>).message ?? JSON.stringify(body, null, 2);
        console.error(`  Reason:  ${reason}`);
      }
    } else {
      console.error(error);
    }
  }
}

// ---------------------------------------------------------------------------
// Main wizard
// ---------------------------------------------------------------------------

export async function runWizard(): Promise<void> {
  console.log('\n=== UpGrade Quicktest Wizard ===\n');

  // ── Mode selection ───────────────────────────────────────────────────────
  const { mode } = await prompts({
    type: 'select',
    name: 'mode',
    message: 'What would you like to do?',
    choices: [
      { title: 'Configure a test run  (build a .config file)', value: 'configure' },
      { title: 'Create an experiment  (call the API directly)', value: 'create' },
    ],
    initial: 0,
  });
  if (mode === undefined) return aborted();
  if (mode === 'create') return runCreateExperiment();

  // ── Step 1: Config name ──────────────────────────────────────────────────
  const { rawName } = await prompts({
    type: 'text',
    name: 'rawName',
    message: 'Name for this config?',
    validate: (v) => (v.trim().length > 0 ? true : 'Name cannot be empty'),
  });

  // ── Step 2: Host URL ────────────────────────────────────────────────────
  const { hostUrl } = await prompts({
    type: 'select',
    name: 'hostUrl',
    message: 'Host URL?',
    choices: QUICKTEST_DEFAULTS.hostUrls.map((url, i) => ({
      title: i === 0 ? `${url}  (default)` : url,
      value: url,
    })),
    initial: 0,
  });

  if (!hostUrl) return aborted();

  // ── Step 3: ADMIN_API_TOKEN ──────────────────────────────────────────────
  const adminApiToken = await promptAdminToken(hostUrl);
  if (adminApiToken === undefined) return aborted();

  // ── Step 4: Fetch context metadata ───────────────────────────────────────
  console.log('\n  Fetching available contexts...');
  const contextMetadata = await fetchContextMetadata(hostUrl, adminApiToken);
  console.log('Done.');
  const availableContexts = Object.keys(contextMetadata);

  if (!rawName) return aborted();
  const configName = toConfigName(rawName);
  console.log(`  → Will save as: ${configName}.quicktest`);

  // ── Step 5: App Context ──────────────────────────────────────────────────
  const contextChoices: prompts.Choice[] = [
    { title: `Default  (${QUICKTEST_DEFAULTS.defaultContext})`, value: '__default__' },
    ...availableContexts.map((c) => ({ title: c, value: c })),
    { title: 'None  (leave blank)', value: '__none__' },
    { title: 'Other  (enter manually)', value: '__other__' },
  ];

  const { rawContext } = await prompts({
    type: 'select',
    name: 'rawContext',
    message: 'App Context?',
    choices: contextChoices,
    initial: 0,
  });

  if (rawContext === undefined) return aborted();

  let context: string;
  if (rawContext === '__default__') {
    context = QUICKTEST_DEFAULTS.defaultContext;
  } else if (rawContext === '__none__') {
    context = '';
  } else if (rawContext === '__other__') {
    const { customContext } = await prompts({
      type: 'text',
      name: 'customContext',
      message: 'Enter context name:',
      validate: (v) => (v.trim().length > 0 ? true : 'Context cannot be empty'),
    });
    if (customContext === undefined) return aborted();
    context = customContext.trim();
  } else {
    context = rawContext;
  }

  // ── Step 6: Session loops ────────────────────────────────────────────────
  const { sessionLoops } = await prompts({
    type: 'number',
    name: 'sessionLoops',
    message: 'How many times to run the user-session script?',
    initial: 1,
    min: 1,
    validate: (v) => (Number.isInteger(v) && v >= 1 ? true : 'Must be a positive integer'),
  });

  if (sessionLoops === undefined) return aborted();

  // ── Step 7: User setup ───────────────────────────────────────────────────
  // Resolve GROUP_TYPES for the chosen context so the wizard can offer them.
  const contextEntry = (contextMetadata as ContextMetadataResponse['contextMetadata'])[context];
  const contextGroupTypes: string[] = contextEntry?.GROUP_TYPES ?? [];

  const user = await promptUser(contextGroupTypes, sessionLoops);
  if (!user) return aborted();

  // ── Step 8: Experiment setup ─────────────────────────────────────────────
  console.log(context ? `\n  Fetching experiments for context "${context}"...` : '\n  Fetching all experiments...');
  const experiments = await fetchExperiments(hostUrl, context, adminApiToken);

  const experimentChoices: prompts.Choice[] = [
    { title: 'None  (no experiment — use random assignments)', value: '__none__' },
    ...experiments.map((e) => ({ title: `${e.name}  —  ${e.id}`, value: e.id })),
    { title: 'Generate  (create a new experiment)', value: '__generate__' },
  ];

  const { experimentPick } = await prompts({
    type: 'select',
    name: 'experimentPick',
    message: 'Experiment?',
    choices: experimentChoices,
    initial: 0,
  });

  if (experimentPick === undefined) return aborted();

  let experiment: ExperimentSetup;
  if (experimentPick === '__none__') {
    experiment = { type: 'none' };
  } else if (experimentPick === '__generate__') {
    const generated = await promptGenerate();
    if (!generated) return aborted();
    experiment = generated;
  } else {
    const found = experiments.find((e) => e.id === experimentPick);
    experiment = { type: 'existing', id: experimentPick, name: found?.name ?? experimentPick };
  }

  // ── Step 9: Script ───────────────────────────────────────────────────────
  const script = await promptScript();
  if (!script) return aborted();

  // ── Step 10: Log metrics (only when doLog is in the script) ──────────────
  let logMetrics: LogMetricValue[] = [];
  if (script.includes('doLog')) {
    const result = await promptLogMetrics(hostUrl, adminApiToken, context, experiment, experiments);
    if (result === null) return aborted();
    logMetrics = result;
  }

  // ── Summary + write ──────────────────────────────────────────────────────
  const wizardResult: WizardResult = {
    configName,
    hostUrl,
    adminApiToken,
    context,
    sessionLoops,
    user,
    experiment,
    script,
    logMetrics,
  };
  printSummary(wizardResult);

  const { confirmWrite } = await prompts({
    type: 'confirm',
    name: 'confirmWrite',
    message: `Write config to "tests/${configName}.quicktest"?`,
    initial: true,
  });

  if (!confirmWrite) {
    console.log('\n  Config not saved.\n');
    return;
  }

  const outputPath = path.resolve(__dirname, 'tests', `${configName}.quicktest`);

  if (fs.existsSync(outputPath)) {
    const { overwrite } = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: `"${configName}.quicktest" already exists. Overwrite?`,
      initial: false,
    });
    if (!overwrite) {
      console.log('\n  Config not saved.\n');
      return;
    }
  }

  fs.writeFileSync(outputPath, buildEnvContent(wizardResult), 'utf8');
  console.log(`\n  Config written → ${outputPath}\n`);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

function printSummary(result: WizardResult) {
  const { configName, hostUrl, adminApiToken, context, sessionLoops, user, experiment, script, logMetrics } = result;
  const W = 31; // inner column width

  const row = (label: string, value: string) => console.log(`║  ${label.padEnd(14)}: ${pad(value, W - 2)}║`);
  const divider = () => console.log(`╠${'═'.repeat(W + 16)}╣`);
  const header = (title: string) => console.log(`║  ${title.padEnd(W + 14)}║`);

  console.log(`\n╔${'═'.repeat(W + 16)}╗`);
  console.log(`║${' Wizard Summary '.padStart(Math.floor((W + 18) / 2)).padEnd(W + 16)}║`);
  divider();

  row('Config name', configName);
  row('Host URL', hostUrl);
  row('API Token', adminApiToken ? '***set***' : '(none)');
  row('Context', context || '(none)');
  row('Session loops', String(sessionLoops));

  divider();
  header('User');
  row('  ID mode', user.userIdMode);
  row('  specifiedId', user.specifiedUserId ?? '(none)');

  const groupEntries = Object.entries(user.groups);
  if (groupEntries.length === 0) {
    row('  groups', '(none)');
  } else {
    groupEntries.forEach(([type, ids]) => row(`  ${type}`, ids.join(', ')));
  }

  if (user.workingGroup) {
    row('  workingGroup', `${user.workingGroup.groupType}: ${user.workingGroup.groupId}`);
  } else {
    row('  workingGroup', '(none)');
  }

  divider();
  header('Experiment');
  if (experiment.type === 'none') {
    row('  setup', 'None');
  } else if (experiment.type === 'existing') {
    row('  setup', 'Existing');
    row('  name', experiment.name);
    row('  id', experiment.id);
  } else {
    const { template, params } = experiment;
    row('  setup', `Generate / ${template}`);
    row('  site', params.site);
    row('  target', params.target);
    row('  conditions', params.conditions.join(', '));
    row('  status', 'enrolling  (auto)');
    row('  algorithm', 'random  (uniform)');
  }

  divider();
  header('Script');
  if (script.length === 0) {
    row('  (empty)', '');
  } else {
    script.forEach((fn, i) => row(`  ${i + 1}.`, fn));
  }

  if (script.includes('doLog')) {
    divider();
    header('Log Metrics');
    if (logMetrics.length === 0) {
      row('  (none)', '— doLog will be skipped at runtime');
    } else {
      logMetrics.forEach((m) => row(`  ${m.key}`, m.value));
    }
  }

  console.log(`╚${'═'.repeat(W + 16)}╝\n`);
}

// ---------------------------------------------------------------------------
// Env file builder
// ---------------------------------------------------------------------------

function buildEnvContent(result: WizardResult): string {
  const { configName, hostUrl, adminApiToken, context, sessionLoops, user, experiment, script, logMetrics } = result;

  // ── experiment fields ────────────────────────────────────────────────────
  let site = '';
  let target = '';
  let experimentId = '';
  let conditions = '';
  if (experiment.type === 'existing') {
    experimentId = experiment.id;
  } else if (experiment.type === 'generate') {
    site = experiment.params.site;
    target = experiment.params.target;
    conditions = experiment.params.conditions.join(',');
  }

  // ── groups ───────────────────────────────────────────────────────────────
  const groupEntries = Object.entries(user.groups);
  const firstGroupType = groupEntries[0]?.[0] ?? '';
  const firstGroupId = groupEntries[0]?.[1]?.[0] ?? '';
  const userGroupsSerialized = groupEntries.map(([type, ids]) => `${type}:${ids.join(',')}`).join(';');
  const wgType = user.workingGroup?.groupType ?? '';
  const wgId = user.workingGroup?.groupId ?? '';

  const lines = [
    `# UpGrade Quicktest Config — ${configName}`,
    `# Generated by wizard`,
    `# Usage: yarn clientlib-ts:quicktest --config ${configName}`,
    ``,
    `# Server`,
    `HOST_URL=${hostUrl}`,
    `ADMIN_API_TOKEN=${adminApiToken}`,
    ``,
    `# App context`,
    `CONTEXT=${context}`,
    ``,
    `# Experiment decision point`,
    `SITE=${site}`,
    `TARGET=${target}`,
    `EXPERIMENT_ID=${experimentId}`,
    ...(experiment.type === 'generate' ? [`CONDITIONS=${conditions}`, `SETUP=true`] : []),
    ``,
    `# Session`,
    `LOOPS=${sessionLoops}`,
    ``,
    `# User ID`,
    `# USER_ID_MODE: RANDOM_EVERY_SESSION_LOOP | RANDOM_SAME_FOR_ALL_LOOPS | SPECIFIED_USER_SAME_ALL_LOOPS`,
    `USER_ID_MODE=${user.userIdMode}`,
    `USER_ID=${user.specifiedUserId ?? ''}`,
    ``,
    `# Group membership`,
    `GROUP_CLASS=${firstGroupType}`,
    `GROUP_VALUE=${firstGroupId}`,
    `# Full groups (groupType:id1,id2;groupType2:id3)`,
    `USER_GROUPS=${userGroupsSerialized}`,
    ``,
    `# Working group`,
    `WORKING_GROUP_TYPE=${wgType}`,
    `WORKING_GROUP_ID=${wgId}`,
    ``,
    `# User session script`,
    `SCRIPT=${script.join(',')}`,
    ``,
    `# Reward testing`,
    `REWARD_VALUE=FAILURE`,
    ``,
    `# Log metrics (key:value pairs for doLog; use ; as separator)`,
    `# Simple metric:  metricKey:value`,
    `# Group metric:   groupClass@__@groupKey@__@attributeName:value`,
    `LOG_METRICS=${logMetrics.map((m) => `${m.key}:${m.value}`).join(';')}`,
    ``,
  ];

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function pad(s: string, len: number): string {
  return s.length > len ? s.slice(0, len - 1) + '…' : s.padEnd(len);
}

function aborted() {
  console.log('\n  Wizard aborted.\n');
}

/** Returns the admin token, or '' if localhost has auth disabled, or undefined if the user cancelled. */
async function promptAdminToken(hostUrl: string): Promise<string | undefined> {
  const isLocal = hostUrl.includes('localhost') || hostUrl.includes('127.0.0.1');
  if (isLocal) {
    const backendEnvPath = path.resolve(__dirname, '../../../packages/backend/.env');
    if (fs.existsSync(backendEnvPath)) {
      const backendEnv = dotenv.parse(fs.readFileSync(backendEnvPath));
      if (backendEnv.GOOGLE_AUTH_TOKEN_REQUIRED === 'false') {
        console.log('\n  [Auth] localhost + GOOGLE_AUTH_TOKEN_REQUIRED=false — skipping token.\n');
        return '';
      }
    }
  }
  const { adminApiToken } = await prompts({
    type: 'text',
    name: 'adminApiToken',
    message: 'ADMIN_API_TOKEN?  (leave blank for none)',
    initial: '',
  });
  return adminApiToken;
}
