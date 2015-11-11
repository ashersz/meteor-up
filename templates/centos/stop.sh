#!/usr/bin/env bash
APP=<%= appName %>
APPPATH=<%= appRemote %>/${APP}
PIDFILE=${APPPATH}/${APP}.pid
if [[ -f ${PIDFILE} ]]; then
  set +e
  sudo kill `cat ${APPPATH}/${APP}.pid`
  set -e
fi
