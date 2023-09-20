/**
 * Version bump will bump the version of all packages in the monorepo
 * It also will tag the commit with the new version
 */

function versionBump(bumpType) {
  return `
    NEW_VERSION=$(jq -r '.version' package.json) &&
    echo "npm version sometimes takes a minute to apply tag apparently, give it a sec" &&
    echo "root:" && npm version ${bumpType} &&       
    echo "types:" && cd types && npm version ${bumpType} --git-tag-version=false &&
    echo "frontend:" && cd ../frontend && npm version ${bumpType} --git-tag-version=false &&
    echo "backend-root:" && cd ../backend && npm version ${bumpType} --git-tag-version=false &&
    echo "scheduler:" && cd packages/Scheduler && npm version ${bumpType} --git-tag-version=false &&
    echo "backend:" && cd ../Upgrade && npm version ${bumpType} --git-tag-version=false &&
    echo "js clientlib:" && cd ../../../clientlibs/js && npm version ${bumpType} --git-tag-version=false &&
    echo "java clientlib:" && cd ../java && mvn versions:set -DnewVersion=${process.env.NEW_VERSION}`;
}

module.exports = {
  scripts: {
    default: 'nps',
    bump: {
      patch: versionBump('patch'),
      minor: versionBump('minor'),
      major: versionBump('major'),
    },
  },
};
