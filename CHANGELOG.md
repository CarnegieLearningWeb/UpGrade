UpGrade 6.2 Release Notes

Primarily bug fixes, enhancements, and vulnerable dependency updates

UI:
- Universally trims text inputs to avoid subtle bugs with unseen spaces or characters
- Improved UX in paginated / search / filtering on experiment page
- Improved consistency in UI elements / messages
- Revised Mooclet TS_Configurable "reward metric" displays

Backend:
- Adds "batch assign" feature for querying multipe users' conditions
- Fixes erroneous "competing decision point" assignments in some complex scenarios
- Improved Metrics query performance
- Fixed CSV export functionality so UI does not wait and accidentally cancel a long-running query
- The algorithm for searching through sub-segments had been capped, it can now handle any depth of nested sub-segments
- Tightening up of several API error-handling and validation cases

Within-Subjects feature:
- New `repeated-enrollment` db table necessary for performant future support
- Fixed data exports

DB changes (backwards compatible, no impact should be noticed):
- Migration needed to add `repeated-enrollment` table
- Migration for 'Draft' status enum added to support future experiment UI refresh

Client Libraries:
- Newest TS and Java clients will "cache" assign and feature flag responses by default, with option to ignore cache and force refetch
- Java client will now require context in the constructor instead of in the getAllExperimentCondtions method
- Backwards compatible, not required to update (but encouraged!)

UpGrade 6.1 Release Notes

Segments Refresh:

- Redesigned UI for Segments pages / modals (UX design kudos to @zackcl)
- Global exclusion segments now separated by app-context (was previously one global list)
- Updated list management for segments with import/export functionality
- Improved search and pagination

Note that the segment data structure has been updated also:

- Backwards compatible, old and new segment structures will both work.
- Newly added segments will see an update UI for working with lists.
- 'Old' segments will continue to be supported, but with the old UI in the details view.
- It is recommended to recreate 'old' style lists to the newer style when convenient.

Other updates:

Metrics display in data tab of experiments has been turned back on in the UI
Performance Optimizations - Improved database queries for metrics and experiment conditions
Error Handling Improvements - Better HTTP error codes with consistent handling across endpoints
Mooclet Integration Backend - Added foundational support for Mooclet experiments (not user-visible in this release)

Angular 19 / Node 22 Support
Java Client support for Java 17 (specifically handling PATCH requests)
Support for ECS Infrastructure, CORS whitelisting

Important note for devs running upgrade instance locally:
- local UI configuration no longer uses the hardcoded `environment.ts` by default in local
- you will need to create an `environment.local.ts` file, which is properly gitignored