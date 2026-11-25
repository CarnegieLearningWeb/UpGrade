# Branching Workflow (Git-Flow)

See this article on [git-flow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) for pretty pictures, as that is essentially what is being described here.

### Branching Conventions

We have 2 branches that never die: `main` and `dev`.

`main` represents current production code. `dev` represents new changes on "next release"

Then we should also have these sub-types of branches:

`feature` `bugfix` `hotfix` `release`

It would be great to also enforce a branch naming convention where these are mandatory and also have the github issue included:

`<branch-type>/<github-issue-number>+<short-descriptor>`

### New feature work:

* To create a new branch for new work, create a branch off of `dev`
* Use this convention: `feature/<github-issue-number>+<short-description>`&#x20;
* If no github issue exists, create one first. Additional github issue number can be appended when necessary, but ideally we are trying to keep PRs as narrowly focused as possible.
* PRs will be opened against `dev`.

```
// pick up issue 777
git fetch
git checkout -b feature/777-implement-annoying-popup origin/dev
git commit -m 'adds annoying popup'
git push
// open PR against dev branch
```

### Releases:

* Tag and deploy the release to staging using our GitHub action.
* Create a release branch off of `dev`
* Use this convention: `release/v1.2` (just major-minor, as the could have any patch version as bugfixes are merged in)
* Push to remote
* (Bugfixes for this release version will get merged into this branch)
* After deploying the release to prod, merge the release branch down into both `main` and `dev`.
* Then delete the release branch! We do not need to maintain this branch any longer, it is now part of `main`

### Bugfixes:

If issues are found in staging environment where release code is deployed...

* Create bug GitHub Issue
* Checkout the release branch from remote
* Create new branch with this convention: `bugfix/<github-issue-number>+<short-description>`
* PRs will be opened against the release branch
* After merged, run `Create Release` action again, this time off of the release branch, to tag and redeploy to staging. (This will pip the patch version)

```
// create bugfix issue 778
git fetch
git checkout -b bugfix/778-horrible-error origin/releases/v1.2
git commit -m 'fixed horrible error'
git push
// open PR against releases/v1.2
// run 'Create Release' to redeploy
```

### Hotfixes

If issues are found in production...

* Create a hotfix Github issue
* Check out `main`
* Create a hotfix test branch `hotfix-staging/v0.1` (so we can open a proper PR instead of just pushing hotfix code to a test region)
* Push hotfix test branch to remote.
* Create local hotfix branch `hotfix/779-oops-all-berries`
* Open PR against `hotfix/v0.1`
* After run, do Create Release again to deploy the hotfix test branch to staging. \[ temporarily using staging env for hotfix instead of release code]
* After deploying the hotfix to production, we would need merge the `hotfix/v0.1` code down into current `releases/v1.2`, `dev`, and `main`
* Redeploy the release code in AWS
