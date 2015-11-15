#!/usr/bin/env bash
# utilities
revert_app (){
  if [[ -d old_app ]]; then
    sudo rm -rf app
    sudo mv old_app app
    sudo systemctl restart <%= appName %>.service

    echo "Latest deployment failed! Reverted back to the previous version." 1>&2
    exit 1
  else
    echo "App did not pick up! Please check app logs." 1>&2
    exit 1
  fi
}
sudo chown -R <%= appUser %>:<%= appUser %> ${APP_HOME}

#reload env variables
. <%= appRemote %>/<%= appName %>/config/env.sh
# restart daemon
sudo systemctl daemon-reload
sudo systemctl enable <%= appName %>.service
sudo systemctl start <%= appName %>.service

echo "Waiting for <%= deployCheckWaitTime %> seconds while app is booting up"
sleep <%= deployCheckWaitTime %>

echo "Checking is app booted or not?"
curl localhost:${PORT} || revert_app
