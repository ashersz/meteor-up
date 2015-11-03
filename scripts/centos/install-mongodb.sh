#!/bin/bash

set -e

sudo mkdir -p /data/db

sudo docker pull mongo:latest
set +e
sudo docker rm -f mongodb
set -e

sudo docker run \
  -d \
  --restart=always \
  --publish=127.0.0.1:27017:27017 \
  --volume=/data/db:/data/db \
  --volume=/etc/mongodb.conf:/mongodb.conf \
  --name=mongodb \
  mongo mongod -f /mongodb.conf
