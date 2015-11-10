#!/bin/bash



# Required to update system
sudo yum update -y

# Install Node.js - either nodeVersion or which works with latest Meteor release
<% if (nodeVersion) { %>
  NODE_VERSION=<%= nodeVersion %>
<% } else {%>
  NODE_VERSION=0.10.40
<% } %>

#sudo yum -y install build-essential libssl-dev git curl
sudo yum -y install gcc gcc-c++ wget

set +e
haveNode=`node --version`
set -e
if [ ! "$haveNode" ]; then
  cd /tmp
  wget http://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}.tar.gz
  tar xvzf node-v${NODE_VERSION}.tar.gz && cd node-v${NODE_VERSION}
  ./configure
  make
  sudo make install
  echo `node --version`
fi
#install npm
sudo yum install epel-release -y
sudo yum install npm -y
