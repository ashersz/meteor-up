#!/bin/bash

# Required to update system
sudo yum update -y

# Install Node.js - either nodeVersion or which works with latest Meteor release
<% if (nodeVersion) { %>
  NODE_VERSION=<%= nodeVersion %>
<% } else {%>
  NODE_VERSION=0.10.40
<% } %>

sudo yum -y install gcc gcc-c++ wget

#install npm and nodejs
sudo yum install epel-release -y
sudo yum install npm nodejs -y
#install nvm, make node available for all user under /usr/local/bin/node
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.29.0/install.sh | bash
nvm install v$NODE_VERSION
nvm alias default v$NODE_VERSION
n=$(which node);n=${n%/bin/node}; chmod -R 755 $n/bin/*; sudo cp -r $n/{bin,lib,share} /usr/local
