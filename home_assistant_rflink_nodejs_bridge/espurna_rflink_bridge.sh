#!/usr/bin/env bash

DEV_NULL=/dev/null
DEV_DEBUG=~/espurna_rflink_bridge_debug.log

TMS=$(date +"%Y-%m-%d %H-%M-%S")
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PID=$(ps -ef | grep -E "espurna_rflink_bridge.js" | grep -v "grep" | awk '{print $2}')

if [ -z "$PID" ];
then
    if [ "$1" == "debug" ] ;
    then
        DEV_OUT=$DEV_DEBUG
        if [ -n "$2" ]; then
            DEV_DEBUG=$2
        fi
        echo "espurna rflink bridge debug mode ON, file '$DEV_DEBUG'"
    else
        DEV_OUT=$DEV_NULL
    fi

    export NODE_PATH=$(npm root -g)

    nohup /usr/bin/node $DIR/espurna_rflink_bridge.js 2>&1 >$DEV_OUT &

    sleep 2

    PID=$(ps -ef | grep -E "espurna_rflink_bridge.js" | grep -v "grep" | awk '{print $2}')

    echo "$TMS DIR=$DIR"
    echo "$TMS PID=$PID"
fi