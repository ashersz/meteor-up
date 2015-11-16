#!/bin/bash

sudo yum install epel-release -y

sudo mkdir -p <%= appRemote %>/<%= appName %>/
sudo mkdir -p <%= appRemote %>/<%= appName %>/config
sudo mkdir -p <%= appRemote %>/<%= appName %>/tmp

# Creating the app user
sudo useradd <%= appUser %>

#sudo chown -R ${USER}:${USER} <%= appRemote %>/<%= appName %>
sudo touch <%= appLog %>/meteor.log
sudo chown <%= appUser %>:<%= appUser %> <%= appLog %>/meteor.log

# install firewalld
sudo yum install firewalld -y
# open appPort, if 3000 redirect 80 to 3000, open 27017 or mongo port todo
sudo systemctl start firewalld.service
sudo firewall-cmd --permanent --add-port=<%= appPort %>/tcp
sudo firewall-cmd --permanent --add-port=27017/tcp
if [ "<%= appPort %>" == "3000" ]; then
    sudo firewall-cmd --permanent --add-forward-port=port=80:proto=tcp:toport=3000
fi;
sudo systemctl enable firewalld
#sudo npm install -g forever userdown wait-for-mongo node-gyp

# allow appUser to run the appName service
sudo -s
echo "<%= appUser %> ALL=(root) NOPASSWD: /usr/bin/systemctl restart <%= appName %>.service" >> /etc/sudoers
echo "<%= appUser %> ALL=(root) NOPASSWD: /usr/bin/systemctl start <%= appName %>.service" >> /etc/sudoers
echo "<%= appUser %> ALL=(root) NOPASSWD: /usr/bin/systemctl stop <%= appName %>.service" >> /etc/sudoers
exit
