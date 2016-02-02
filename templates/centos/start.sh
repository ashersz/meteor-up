#!/bin/bash

APPNAME=<%= appName %>
APP_PATH=<%= appRemote %>/$APPNAME
BUNDLE_PATH=$APP_PATH/current
LOG_PATH=$APP_PATH/logs
ENV_FILE=$APP_PATH/config/env.list
echo "env_file=$ENV_FILE"
echo "current folder=`pwd`"
PORT=<%= port %>
echo "port=$PORT"
USE_LOCAL_MONGO=<%= useLocalMongo? "1" : "0" %>
USE_LOCAL_NETWORK=<%= useLocalNetwork? "1" : "0" %>
echo "use_local_network=$USE_LOCAL_NETWORK"

# Remove previous version of the app, if exists
docker rm -f $APPNAME

# Remove frontend container if exists
docker rm -f $APPNAME-frontend

# We don't need to fail the deployment because of a docker hub downtime
set +e
docker pull curiyo/meteord:base
set -e

if [ "$USE_LOCAL_MONGO" == "1" ]; then
  docker run \
    -d \
    --restart=always \
    --publish=$PORT:80 \
    --volume=$BUNDLE_PATH:/bundle \
    --env-file=$ENV_FILE \
    --link=mongodb:mongodb \
    --hostname="$HOSTNAME-$APPNAME" \
    --env=MONGO_URL=mongodb://mongodb:27017/$APPNAME \
    --name=$APPNAME \
    curiyo/meteord:base
else
  if [ "$USE_LOCAL_NETWORK" == "1" ]; then
    docker run \
    -d \
    --restart=always \
    --net=host \
    --publish="127.0.0.1:$PORT:$PORT" \
    --volume=$BUNDLE_PATH:/bundle \
    --volume=$LOG_PATH:/logs \
    --env-file=$ENV_FILE \
    --name=$APPNAME \
    curiyo/meteord:base
  else
    docker run \
      -d \
      --restart=always \
      --publish=$PORT:$PORT \
      --volume=$BUNDLE_PATH:/bundle \
      --volume=$LOG_PATH:/logs \
      --hostname="$HOSTNAME-$APPNAME" \
      --env-file=$ENV_FILE \
      --name=$APPNAME \
      curiyo/meteord:base
  fi
fi

<% if(typeof sslConfig === "object")  { %>
  # We don't need to fail the deployment because of a docker hub downtime
  set +e
  docker pull meteorhacks/mup-frontend-server:latest
  set -e
  docker run \
    -d \
    --restart=always \
    --volume=<%= appRemote %>/$APPNAME/config/bundle.crt:/bundle.crt \
    --volume=<%= appRemote %>/$APPNAME/config/private.key:/private.key \
    --link=$APPNAME:backend \
    --publish=<%= sslConfig.port %>:443 \
    --name=$APPNAME-frontend \
    meteorhacks/mup-frontend-server /start.sh
<% } %>
