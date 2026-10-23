#!/usr/bin/env bash
#
# Starts QuickTestBurstUi, the local web page for QuickTestBurst runs (clientlibs/java).
#
#   yarn quickburst:ui               serve it at http://localhost:8090
#   yarn quickburst:ui --port 8091   on another port, e.g. when one is already running in another worktree
#
# Compiles the Java client first, so the page always runs the current code. Needs Maven and a JDK (17+).
# --env qa / staging need UPGRADE_QA_URL / UPGRADE_STAGING_URL exported in the shell this runs from; see
# clientlibs/java/src/main/java/org/upgradeplatform/client/QuickTestHosts.java. Ctrl-C stops it, along with any run in
# progress.

set -euo pipefail

cd "$(dirname "$0")/../clientlibs/java"
exec mvn -q compile exec:java -Dexec.mainClass=org.upgradeplatform.client.QuickTestBurstUi ${1:+"-Dexec.args=$*"}
