#!/bin/bash

sudo mkdir -p <%= appRemote %>/<%= appName %>/
sudo mkdir -p <%= appRemote %>/<%= appName %>/config
sudo mkdir -p <%= appRemote %>/<%= appName %>/tmp
sudo mkdir -p <%= appRemote %>/mongodb

sudo -u ${USER} chown ${USER}:${USER} <%= appRemote %>/<%= appName %> -R
sudo -u ${USER} chown ${USER}:${USER} <%= appRemote %>/mongodb -R

sudo usermod -a -G docker ${USER}
