#!/bin/bash

set -e
APP_HOME=<%= appRemote %>/<%= appName %>
TMP_DIR=${APP_HOME}/tmp
BUNDLE_DIR=${TMP_DIR}/bundle
LOG_FILE=<%= appLog %>/meteor.log

cd ${TMP_DIR}
sudo rm -rf bundle
sudo tar xvzf bundle.tar.gz > /dev/null
sudo chmod -R +x *

# rebuilding fibers
cd ${BUNDLE_DIR}/programs/server
# install npm dependencies
sudo npm install

cd ${APP_HOME}

# remove old app, if it exists
if [ -d old_app ]; then
  sudo rm -rf old_app
fi

## backup current version
if [[ -d app ]]; then
  sudo mv app old_app
fi

sudo mv tmp/bundle app


sudo mv ${APP_HOME}/<%= appName %>.service /etc/systemd/system
sudo touch ${LOG_FILE}

sudo chown -R <%= appUser %>:<%= appUser %> ${LOG_FILE}
