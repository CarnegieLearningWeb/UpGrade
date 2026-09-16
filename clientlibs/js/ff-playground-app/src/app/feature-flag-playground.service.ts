import { Injectable, signal } from '@angular/core';
import UpgradeClient, { UpGradeClientInterfaces } from 'upgrade_client_lib';

/**
 * ============================================================================
 * PLAYGROUND SERVICE
 * ============================================================================
 * This is the one file meant for hands-on experimentation with the
 * upgrade_client_lib feature-flag API. See ../../../docs/feature-flags-guide.md
 * for the full write-up of every mode used here.
 *
 * The component (app.ts) only ever calls `login()`/`logout()` and reads the
 * signals below — all the actual client-library usage lives in this file.
 * Edit the marked blocks in `login()` to try the alternate recipes.
 * ============================================================================
 */

export type GroupType = 'schoolId' | 'classId' | 'districtId' | 'instructorId';

export interface GroupEntry {
  type: GroupType;
  values: string[];
}

// Point these at whatever backend/context you're testing against.
const HOST_URL = 'http://localhost:3030';
const CONTEXT = 'upgrade-internal';

// The two flags this playground exercises. Create both, under the context
// above, via the admin UI before expecting anything but "off" from either.
export const SQUARE_COLOR_FLAG = 'SQUARE_COLOR_FLAG_FOR_USER';
export const SCHOOL_CIRCLE_FLAG = 'SCHOOL_CIRCLE_FLAG';

@Injectable({ providedIn: 'root' })
export class FeatureFlagPlaygroundService {
  private client: UpgradeClient | null = null;

  readonly loggedIn = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly userId = signal<string>('');
  readonly allGroups = signal<Record<string, string[]>>({});

  readonly squareEnabled = signal(false);
  readonly schoolIds = signal<string[]>([]);
  readonly schoolCircleStates = signal<Record<string, boolean>>({});

  async login(userId: string, groups: GroupEntry[]): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    const allGroups: Record<string, string[]> = {};
    for (const { type, values } of groups) {
      if (values.length) {
        allGroups[type] = [...new Set([...(allGroups[type] ?? []), ...values])];
      }
    }
    const schoolIds = allGroups['schoolId'] ?? [];
    const fullGroupset = { groups: allGroups };
    const schoolSubGroupsets = schoolIds.map((schoolId) => ({
      groupsetId: schoolId,
      groups: { schoolId: [schoolId] },
    }));

    // useMultipleGroupSets.subGroupsets can't be empty, so with no schoolIds this falls back to a
    // plain useSingleGroupSet — still ephemeral, still one call, just nothing to fan out over.
    const featureFlagGroupOptions: UpGradeClientInterfaces.IFeatureFlagGroupOptions =
      schoolSubGroupsets.length > 0
        ? {
            useMultipleGroupSets: {
              mainGroupset: fullGroupset,
              subGroupsets: schoolSubGroupsets,
            },
          }
        : {
            useSingleGroupSet: fullGroupset,
          };

    // deprecated but still valid, no plans to remove:

    // const featureFlagGroupOptions: UpGradeClientInterfaces.IFeatureFlagOptions = {
    //   groupsForSession: allGroups,
    //   includeStoredUserGroups: true,
    // };

    try {
      // ----------------------------------------------------------------------
      // RECOMMENDED PATH — one groupset configuration, one network call. The
      // SQUARE feature reads the mainGroupset (the "whole user" view built
      // from everything just typed in); each school's CIRCLE reads its own
      // named subGroupset.
      // ----------------------------------------------------------------------

      this.client = new UpgradeClient(userId, HOST_URL, CONTEXT, {
        featureFlagGroupOptions: featureFlagGroupOptions,
      });

      // this.client = new UpgradeClient(userId, HOST_URL, CONTEXT, {
      //   featureFlagUserGroupsForSession: featureFlagGroupOptions,
      // });

      // ----------------------------------------------------------------------
      // ALTERNATE RECIPES — comment out the block above and uncomment one of
      // these to see how the square's behavior changes. Both require the
      // backend to already have an initialized user (they'll otherwise 404).
      // ----------------------------------------------------------------------
      //
      // STORED MODE — ignores `fullGroupset` above entirely; uses whatever
      // groups are already stored for this user id:
      //
      // this.client = new UpgradeClient(userId, HOST_URL, CONTEXT);
      // await this.client.init();
      //
      // MERGED MODE — stored groups, plus these as overrides on top, as a
      // single groupset (no per-school subGroupsets, so the square is the
      // only thing this affects):
      //
      // this.client = new UpgradeClient(userId, HOST_URL, CONTEXT);
      // await this.client.init();
      // this.client.setFeatureFlagGroupOptions({
      //   useSingleGroupSet: { ...fullGroupset, includeStoredUserGroups: true },
      // });

      // One call fetches everything configured above — mainGroupset (or the
      // single groupset) plus every subGroupset — in a single HTTP request.
      await this.client.getAllFeatureFlags();

      // hasFeatureFlag(key) with no id resolves to the mainGroupset/single
      // groupset; hasFeatureFlag(key, schoolId) reads the matching
      // subGroupset. Both are served from the cache the call above populated
      // — no further network calls.
      this.squareEnabled.set(await this.client.hasFeatureFlag(SQUARE_COLOR_FLAG));

      const states: Record<string, boolean> = {};
      for (const schoolId of schoolIds) {
        states[schoolId] = await this.client.hasFeatureFlag(SCHOOL_CIRCLE_FLAG, schoolId);
      }
      this.schoolCircleStates.set(states);

      this.userId.set(userId);
      this.allGroups.set(allGroups);
      this.schoolIds.set(schoolIds);
      this.loggedIn.set(true);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : String(err));
      this.client = null;
    } finally {
      this.loading.set(false);
    }
  }

  logout(): void {
    this.client = null;
    this.loggedIn.set(false);
    this.error.set(null);
    this.userId.set('');
    this.allGroups.set({});
    this.squareEnabled.set(false);
    this.schoolIds.set([]);
    this.schoolCircleStates.set({});
  }
}
