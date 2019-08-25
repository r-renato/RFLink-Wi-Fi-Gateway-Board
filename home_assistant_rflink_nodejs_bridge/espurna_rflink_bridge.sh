#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PID=$(ps -ef | grep -E "node|espurna_rflink_bridge.js" | grep -v "grep" | awk '{print $2}')

echo "DIR= $DIR"
echo "PID= $PID"

if [ -z "$PID" ];
then
  nohup /usr/bin/node $DIR/espurna_rflink_bridge.js >/dev/null 2>&1 &
fi