---
name: teardown-perftrace
description: Remove the temporary performance tracing installed by /setup-perftrace from the UpGrade backend, restoring every touched file byte-exact from its snapshot. Use when finished profiling, when asked to "remove the perf traces", "clean up the instrumentation", or before committing a branch that was harnessed for tracing.
---

# teardown-perftrace

Reverses `/setup-perftrace` using the snapshot manifest it left behind. Restoration is byte-exact,
so re-indentation from wrapping code in callbacks unwinds cleanly — which is exactly what a
comment-marker or regex approach cannot do reliably.

## Step 1 — Read the manifest

```bash
cat .claude/.perftrace/manifest.json
```

If it is missing, do **not** start guessing at edits. Instead report that, and offer the fallback in
[No manifest](#no-manifest).

**Expect roughly seven entries, not two.** A fully instrumented install covers the harness file, the
app loader, both client middlewares, the v6 controller, `ExperimentAssignmentService`, and
`FeatureFlagService`. Fewer is legitimate — the user may have instrumented only one endpoint — so
the manifest, not the expected footprint, is authoritative for *what to restore*. Use the footprint
only as the stray check in Step 5: if the manifest lists two entries but the tree has `tracePerf`
calls in five files, the manifest is incomplete and Step 5 is what will catch it.

## Step 2 — Detect drift before restoring anything

For every `modified` entry, compare the current file against `sha256AfterSetup`:

```bash
shasum -a 256 <path> | cut -d' ' -f1
```

- **Matches** — untouched since setup. Safe to restore silently.
- **Differs** — the file changed after setup. Either you added spans in a later turn (expected), or
  the user made unrelated edits (must not be lost).

For every file that differs, show the user a diff of what restoring would discard:

```bash
diff <(cat .claude/.perftrace/backups/<backup>) <path>
```

If the only differences are perf spans, restore. If there is unrelated work mixed in, **stop and
ask** — restoring would silently delete it. Offer to reapply their changes on top of the restored
file instead.

With a full install this check spans ~7 files, and a mismatch on the heavily instrumented ones
(`ExperimentAssignmentService.ts` carries ~20 spans) is *expected* rather than alarming — setup
fills in `sha256AfterSetup` per file, but any later turn that added a span leaves the hash stale.
Read each diff on its own merits; do not batch-approve them because the first one looked routine.

## Step 3 — Restore

- `action: "modified"` → copy the backup back over the path.
- `action: "created"` → delete the file.

Then remove now-empty directories the setup created:

```bash
rmdir packages/backend/src/lib/perf 2>/dev/null || true
```

## Step 4 — Remove the env vars

Strip the `PERF_TRACE_*` block from `packages/backend/.env`, including its comments. Leave
`.env.example` and `.env.test` alone — setup never touches them.

## Step 5 — Verify nothing is left behind

```bash
grep -rn "perfTrace\|tracePerfAsync\|tracePerfSync\|PERF_TRACE\|perfTraceMiddleware" \
  packages/backend/src packages/backend/test packages/backend/.env 2>/dev/null
```

Expect zero hits. Any hit means a file was instrumented without being added to the manifest —
remove it by hand and say so explicitly in your summary. This is the single most important check in
this skill: the manifest can be incomplete, but a leftover `tracePerfAsync` import is a compile
error waiting to happen once `perfTrace.ts` is deleted, and a leftover span is instrumentation that
ships. Treat a non-empty result as a failed teardown, not a warning.

To strip a stray by hand, recover the original shape from the reference branch rather than
un-indenting by eye:

```bash
git show origin/reference/client-perftraces:<path> | grep -n tracePerf   # what setup added
git diff origin/dev -- <path>                                            # what is left to undo
```

Confirm the app bootstrap is back to `createExpressServer`:

```bash
grep -n "createExpressServer\|useExpressServer" packages/backend/src/loaders/app/index.ts
```

Then:

```bash
cd packages/backend && npx tsc --noEmit && npx jest --config=jest.config.js test/unit
```

Finally, confirm the diff is clean — the branch should show no perf-related changes:

```bash
git status --short && git diff --stat
```

## Step 6 — Remove the manifest

```bash
rm -rf .claude/.perftrace
```

Report which files were restored, which were deleted, and anything you found that was not in the
manifest.

## No manifest

If `.claude/.perftrace/manifest.json` is gone, fall back to git rather than hand-editing:

1. `git status --short` and `git diff` to see what the harness touched.
2. If the instrumentation is uncommitted, `git checkout -- <files>` for modified ones and delete
   `packages/backend/src/lib/perf/perfTrace.ts`. **Check the diff first** — if unrelated uncommitted
   work is in the same files, `git checkout` will destroy it. Ask before doing that.
3. If it was committed, identify the commit and `git revert` it.
4. Run the Step 5 verification either way.

Say plainly that you worked without a manifest and that removal was inferred from the diff rather
than restored from a snapshot.
