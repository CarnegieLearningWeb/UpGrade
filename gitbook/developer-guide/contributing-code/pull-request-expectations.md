# Pull Request Expectations

## Contribution Guidelines

## 1. PR Branches are tied to well-defined Github Issues.

Ideally:

* Most branches should be tied to ONE GitHub issue.
* Therefore, GitHub issues must be well-defined:
  * Does it have a target release / priority?
  * Does it have a sufficiently narrow scope that it can be completed in one PR that a peer can read and review?
  * Does it have clear, testable requirements?
* GitHub issues that are not well-defined should not be worked!

## 2. PRs are small, focused, and complete.

Ideally:

* Most PRs should be tied to ONE Github issue.
* The changes should be as small as possible, focused only on changes related to the linked issue, and 100% complete.
* The changes should be reviewable; a peer can mostly read and understand the changes at a high level without running the code.
* Work that has ballooned in scope should be discussed with team long before a PR goes up. This is either a symptom of poorly-defined github issues, or discovery of complexity that should warrant revisiting the issue.
* PRs that contain work from unrelated/untracked issues or are too large/complex to be reviewable within 48 hrs may be rejected as unreviewable.

## 3. Code-Reviews for PRs should be initiated ASAP.

Ideally:

* We should set up an expectation of code-review quickly, within 24 hrs, 48 hrs at most, and merge swiftly also if there's no changes to request.
* It would be really annoying to ask for small PRs and then make people wait. They likely are depending on those changes and/or will move on to another task if they give up on us.
* Anyone should feel OK to reject a PR if it is too complex or too large to review in any substantial way within 48 hrs, especially if we are very clear up front about PR expectations. No deliverables are worth blindly merging code.
