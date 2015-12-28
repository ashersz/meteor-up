#!/usr/bin/env bash
# utilities
revert_app (){
  if [[ -d $APP_HOME/old_app ]]; then
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
APP_HOME=<%= appRemote %>/<%= appName %>
sudo chown -R <%= appUser %>:<%= appUser %> ${APP_HOME}

#reload env variables
. ${APP_HOME}/config/env.sh
# restart daemon
sudo systemctl daemon-reload
if [[ -d $APP_HOME/old_app ]]; then
  echo "restarting <%= appName %>.service"
    sudo systemctl restart <%= appName %>.service
else
  echo "enabling and starting <%= appName %>.service"
  sudo systemctl enable <%= appName %>.service
  sudo systemctl start <%= appName %>.service
fi

echo "Waiting for <%= deployCheckWaitTime %> seconds while app is booting up"
sleep <%= deployCheckWaitTime %>

echo "Checking is app booted or not?"
curl localhost:${PORT} || revert_app
