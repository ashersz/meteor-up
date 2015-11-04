#!/bin/bash

# Is docker already installed?
echo "I am here 1"
set +e
haveDocker=$(docker version | grep "version")
set -e

if [ ! "$haveDocker" ]; then

  # Remove the lock
  set +e
  sudo rm /var/lib/dpkg/lock > /dev/null
  sudo rm /var/cache/apt/archives/lock > /dev/null
  sudo dpkg --configure -a
  set -e
  echo "I am here 2"
  # Required to update system
  sudo yum update
  echo "I am here 3"
  # Install docker
  #wget -qO- https://get.docker.com/ | sudo sh
  curl -sSL https://get.docker.com/ | sudo sh
  sudo service docker start
  sudo chkconfig docker on
  echo "I am here 4"
fi
