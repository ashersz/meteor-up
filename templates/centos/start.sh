#!/usr/bin/env bash
DIR=<%= appRemote %>/<%= appName %>
NODE=/usr/local/bin/node
PORT=${PORT:-3000}
test -x $NODE || exit 0
mkdir -p ~/logs
touch ~/logs/meteor.log
cd $DIR/app
env PORT=$PORT MONGO_URL=$MONGO_URL ROOT_URL=$ROOT_URL:$PORT $NODE main.js 1>>"~/logs/meteor.log" 2>&1 &
echo $! > "$DIR/<%= appName %>.pid"
