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