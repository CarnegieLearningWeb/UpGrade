#!/usr/bin/env bash
#
# Multi-instance cache demo for the valid-experiments cache.
#
#   yarn cache-demo up        start 4 backend instances on :3040-:3043, point the UI at :3040
#   yarn cache-demo watch     live per-instance cache fingerprints under light traffic
#   yarn cache-demo observe   shadow your own load test: no synthetic traffic, slow poll
#   yarn cache-demo refreshes count actual experiment queries over a window (pg_stat_statements)
#   yarn cache-demo contexts  which contexts are cached, and which have experiments
#   yarn cache-demo demo      the whole story: warm, change the DB, measure propagation
#   yarn cache-demo traffic   just generate light round-robin load
#   yarn cache-demo status    which instances are up
#   yarn cache-demo logs 1    tail instance 1's log
#   yarn cache-demo down      stop all instances, restore the UI's apiBaseUrl
#
# All four instances share whatever database packages/backend/.env points at, and inherit that file
# for everything except the cache knobs below. dotenv does not override real environment variables,
# so these win.
#
# 'up' also repoints the Angular local environment's apiBaseUrl at the first instance (:3040) so the
# UI talks to the fleet instead of your usual :3030 backend; 'down' puts the file back. A running
# `ng serve` picks up both edits on its own.
#
# Sweep a calibration by re-running with different values:
#   TTL=3600 REFRESH=45 yarn cache-demo up
#
# REFRESH is the staleness bound: expect propagation in roughly REFRESH seconds regardless of how
# long the TTL is. A REFRESH longer than the TTL means the TTL expires first and refresh-ahead is
# inactive, so propagation falls back to roughly TTL plus the gap until the next request.

set -euo pipefail

cd "$(dirname "$0")/.."

PORTS=(3040 3041 3042 3043)
RUN_DIR="${TMPDIR:-/tmp}/upgrade-cache-demo"
PID_FILE="$RUN_DIR/pids"
TTL="${TTL:-1800}"
REFRESH="${REFRESH:-30}"
DRIVER=(node scripts/cache-demo.mjs)
ENV_LOCAL="packages/frontend/projects/upgrade/src/environments/environment.local.ts"
ENV_BACKUP="$RUN_DIR/environment.local.ts.orig"

# The frontend's local env file is gitignored and may not exist; treat that as "nothing to point".
point_frontend_at_fleet() {
  local port="${PORTS[0]}"
  if [[ ! -f "$ENV_LOCAL" ]]; then
    echo "  no $ENV_LOCAL — skipping (copy environment.local.example.ts to create it)"
    return 0
  fi
  # Keep the oldest backup: a re-run after a half-torn-down fleet would otherwise back up a file
  # already pointing at :3040, and 'down' would never get back to the real value.
  [[ -f "$ENV_BACKUP" ]] || cp "$ENV_LOCAL" "$ENV_BACKUP"
  sed "s|apiBaseUrl: '[^']*'|apiBaseUrl: 'http://localhost:$port/api'|" "$ENV_BACKUP" >"$ENV_LOCAL"
  echo "  apiBaseUrl -> http://localhost:$port/api"
}

restore_frontend() {
  [[ -f "$ENV_BACKUP" ]] || return 0
  cp "$ENV_BACKUP" "$ENV_LOCAL"
  rm -f "$ENV_BACKUP"
  echo "  restored apiBaseUrl in $ENV_LOCAL"
}

start_instance() {
  local port="$1"
  # cwd must be packages/backend — env.ts loads .env relative to process.cwd().
  (
    cd packages/backend
    exec env \
      APP_PORT="$port" \
      CACHING_ENABLED=true \
      CACHING_TTL_EXPERIMENTS="$TTL" \
      CACHING_REFRESH_THRESHOLD="$REFRESH" \
      ./node_modules/.bin/ts-node -r tsconfig-paths/register ./src/app.ts \
      >"$RUN_DIR/$port.log" 2>&1
  ) &
  echo "$!" >>"$PID_FILE"
}

wait_for() {
  local port="$1" tries=60
  printf '  :%s ' "$port"
  while ((tries-- > 0)); do
    if curl -sf -o /dev/null "http://localhost:$port/api/experiments/cache"; then
      printf ' ready\n'
      return 0
    fi
    printf '.'
    sleep 2
  done
  printf ' TIMEOUT\n'
  echo "  last lines of $RUN_DIR/$port.log:"
  tail -5 "$RUN_DIR/$port.log" | sed 's/^/    /'
  return 1
}

cmd_up() {
  for port in "${PORTS[@]}"; do
    if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      echo "port $port is already in use — run 'down' first, or free it" >&2
      exit 1
    fi
  done

  mkdir -p "$RUN_DIR"
  : >"$PID_FILE"

  echo "==> instance 1 first, alone (it runs migrations; four at once would race)"
  start_instance "${PORTS[0]}"
  wait_for "${PORTS[0]}"

  echo "==> instances 2-4"
  for port in "${PORTS[@]:1}"; do start_instance "$port"; done
  for port in "${PORTS[@]:1}"; do wait_for "$port"; done

  echo "==> creating the demo experiment user"
  "${DRIVER[@]}" init

  echo "==> pointing the Angular local environment at the fleet"
  point_frontend_at_fleet

  echo
  echo "fleet up on ${PORTS[*]}   ttl=${TTL}s, refreshing every ${REFRESH}s (expect ~${REFRESH}s propagation)"
  echo "logs: $RUN_DIR"
  echo
  echo "next:  yarn cache-demo demo"
}

cmd_down() {
  local candidates="" pid port tries alive

  restore_frontend

  [[ -f "$PID_FILE" ]] && candidates="$(cat "$PID_FILE")"
  # Also reap whatever is holding our ports: the app doesn't always exit on SIGTERM, and a run whose
  # pid file went missing would otherwise leave the ports bound with nothing tracking them.
  for port in "${PORTS[@]}"; do
    candidates="$candidates $(lsof -ti TCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  done

  # shellcheck disable=SC2086
  candidates="$(echo $candidates | tr ' ' '\n' | grep -E '^[0-9]+$' | sort -u || true)"
  if [[ -z "$candidates" ]]; then
    echo "nothing running on ${PORTS[*]}"
    rm -f "$PID_FILE"
    return 0
  fi

  for pid in $candidates; do kill "$pid" 2>/dev/null || true; done

  tries=10
  while ((tries-- > 0)); do
    alive=0
    for pid in $candidates; do kill -0 "$pid" 2>/dev/null && alive=1; done
    ((alive == 0)) && break
    sleep 1
  done

  for pid in $candidates; do
    if kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" 2>/dev/null && echo "  force-killed $pid (ignored SIGTERM)"
    else
      echo "  stopped $pid"
    fi
  done
  rm -f "$PID_FILE"

  for port in "${PORTS[@]}"; do
    if lsof -ti TCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      echo "  WARNING: port $port is still bound" >&2
    fi
  done
}

cmd_status() {
  for index in "${!PORTS[@]}"; do
    local port="${PORTS[$index]}"
    if curl -sf -o /dev/null "http://localhost:$port/api/experiments/cache"; then
      echo "  instance $((index + 1))  :$port  up"
    else
      echo "  instance $((index + 1))  :$port  down"
    fi
  done
}

case "${1:-help}" in
  up) cmd_up ;;
  down) cmd_down ;;
  status) cmd_status ;;
  demo) shift; "${DRIVER[@]}" converge "$@" ;;
  watch) shift; "${DRIVER[@]}" watch "$@" ;;
  contexts) shift; "${DRIVER[@]}" contexts "$@" ;;
  refreshes) shift; "${DRIVER[@]}" refreshes "$@" ;;
  # Shadow an external load test: observe only, no synthetic traffic, wall-clock stamps, run until
  # ctrl-c. A slow poll keeps the observer from perturbing the run it is measuring.
  observe) shift; "${DRIVER[@]}" watch --rps 0 --interval 10 --duration 0 --keys "$@" ;;
  traffic) shift; "${DRIVER[@]}" traffic "$@" ;;
  logs) tail -f "$RUN_DIR/${PORTS[$((${2:-1} - 1))]}.log" ;;
  *) sed -n '3,14p' "$0" | sed 's/^# \?//' ;;
esac
