#!/usr/bin/env bash

TMS=$(date +"%Y-%m-%d %H-%M-%S")
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PID=$(ps -ef | grep -E "espurna_rflink_bridge.js" | grep -v "grep" | awk '{print $2}')

if [ -z "$PID" ];
then
  nohup /usr/bin/node $DIR/espurna_rflink_bridge.js >/dev/null 2>&1 &

  sleep 2

  PID=$(ps -ef | grep -E "espurna_rflink_bridge.js" | grep -v "grep" | awk '{print $2}')

  echo "$TMS DIR=$DIR"
  echo "$TMS PID=$PID"
fi