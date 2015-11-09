#!/bin/bash

# Is docker already installed?
echo "I am here 1"
set +e
haveDocker=$(docker version | grep "version")
set -e

if [ ! "$haveDocker" ]; then

  # Remove the lock
  # does not seem to be needed in centos
  #set +e
  #sudo rm /var/lib/dpkg/lock > /dev/null
  #sudo rm /var/cache/apt/archives/lock > /dev/null
  #sudo dpkg --configure -a
  #set -e

  # Required to update system
  sudo yum update -y
  # Install docker
  curl -sSL https://get.docker.com/ | sudo sh
  sudo service docker start
  sudo chkconfig docker on
fi
