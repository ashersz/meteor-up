#!/usr/bin/env bash
DIR=<%= appRemote %>/<%= appName %>
NODE=/usr/local/bin/node
. ${DIR}/config/env.sh
PORT=${PORT:-3000}
test -x $NODE || exit 0
mkdir -p ~/logs
LOGFILE=~/logs/meteor.log
touch ${LOGFILE}
cd $DIR/app
env PORT=$PORT MONGO_URL=$MONGO_URL ROOT_URL=$ROOT_URL:$PORT $NODE main.js 1>> ${LOGFILE} 2>&1 &
echo $! > "$DIR/<%= appName %>.pid"
