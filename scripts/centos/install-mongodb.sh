#!/bin/bash

# Remove the lock
#set +e
#sudo rm /var/lib/dpkg/lock > /dev/null
#sudo rm /var/cache/apt/archives/lock > /dev/null
#sudo dpkg --configure -a
#set -e
echo "[mongodb-org-2.6]" >> /etc/yum.repos.d/mongodb-org-2.6.repo
echo "name=MongoDB 2.6 Repository" >> /etc/yum.repos.d/mongodb-org-2.6.repo
echo "baseurl=http://downloads-distro.mongodb.org/repo/redhat/os/x86_64/" >> /etc/yum.repos.d/mongodb-org-2.6.repo
echo "gpgcheck=0" >> /etc/yum.repos.d/mongodb-org-2.6.repo
echo "enabled=1" >> /etc/yum.repos.d/mongodb-org-2.6.repo

sudo yum install mongo-10gen mongo-10gen-server -y

sudo chkconfig mongod on
