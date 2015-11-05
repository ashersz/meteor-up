var nodemiral = require('nodemiral-forcetty');
var fs = require('fs');
var path = require('path');
var util = require('util');
var _ = require('underscore');

var SCRIPT_DIR = path.resolve(__dirname, '../../scripts/centos');
var TEMPLATES_DIR = path.resolve(__dirname, '../../templates/centos');

exports.setup = function(config) {
  var taskList = nodemiral.taskList('Setup (Centos)');
  var PATH_TO_DOCKER_SCRIPT = path.resolve(SCRIPT_DIR, 'install-docker.sh');
  console.log("path to docker script="+PATH_TO_DOCKER_SCRIPT);
  taskList.executeScript('Installing Docker', {
    script: PATH_TO_DOCKER_SCRIPT
  });

  taskList.executeScript('Setting up Environment', {
    script: path.resolve(SCRIPT_DIR, 'setup-env.sh'),
    vars: {
      appName: config.appName,
      appRemote: config.appRemote
    }
  });

  if(config.setupMongo) {
    taskList.copy('Copying MongoDB configuration', {
      src: path.resolve(TEMPLATES_DIR, 'mongodb.conf'),
      dest: config.appRemote + '/mongod/mongodb.conf'
    });

    taskList.executeScript('Installing MongoDB', {
      script: path.resolve(SCRIPT_DIR, 'install-mongodb.sh')
    });
  }

  if(config.ssl) {
    taskList.copy('Copying SSL certificate bundle', {
      src: config.ssl.certificate,
      dest: config.appRemote + '/config/bundle.crt'
    });

    taskList.copy('Copying SSL private key', {
      src: config.ssl.key,
      dest: config.appRemote + '/config/private.key'
    });

    taskList.executeScript('Verifying SSL configurations', {
      script: path.resolve(SCRIPT_DIR, 'verify-ssl-configurations.sh'),
      vars: {
        appName: config.appName
      }
    });
  }

  return taskList;
};

exports.deploy = function(bundlePath, env, config) {
  var deployCheckWaitTime = config.deployCheckWaitTime;
  var appName = config.appName;
  var appRemote = config.appRemote;
  var taskList = nodemiral.taskList("Deploy app '" + appName + "' (Centos)");

  taskList.copy('Uploading bundle', {
    src: bundlePath,
    dest:  appRemote + '/'+appName+'/bundle.tar.gz',
    progressBar: config.enableUploadProgressBar
  });

  copyEnvVars(taskList, env, appName, appRemote);

  taskList.copy('Initializing start script', {
    src: path.resolve(TEMPLATES_DIR, 'start.sh'),
    dest: appRemote + '/'+appName + '/config/start.sh',
    vars: {
      appName: appName,
      appRemote: appRemote,
      useLocalMongo: config.setupMongo,
      port: env.PORT,
      sslConfig: config.ssl
    }
  });

  deployAndVerify(taskList, appName, appRemote, env.PORT, deployCheckWaitTime);

  return taskList;
};

exports.reconfig = function(env, config) {
  var appName = config.appName;
  var appRemote = config.appRemote;
  var deployCheckWaitTime = config.deployCheckWaitTime;

  var taskList = nodemiral.taskList("Updating configurations (Centos)");

  copyEnvVars(taskList, env, appName, appRemote);
  startAndVerify(taskList, appName, appRemote, env.PORT, deployCheckWaitTime);

  return taskList;
};

exports.restart = function(config) {
  var taskList = nodemiral.taskList("Restarting Application (Centos)");

  var appName = config.appName;
  var appRemote = config.appRemote;
  var port = config.env.PORT;
  var deployCheckWaitTime = config.deployCheckWaitTime;

  startAndVerify(taskList, appName, appRemote, port, deployCheckWaitTime);

  return taskList;
};

exports.stop = function(config) {
  var taskList = nodemiral.taskList("Stopping Application (Centos)");

  //stopping
  taskList.executeScript('Stopping app', {
    script: path.resolve(SCRIPT_DIR, 'stop.sh'),
    vars: {
      appName: config.appName
    }
  });

  return taskList;
};

exports.start = function(config) {
  var taskList = nodemiral.taskList("Starting Application (Centos)");

  var appName = config.appName;
  var appRemote = config.appRemote;
  var port = config.env.PORT;
  var deployCheckWaitTime = config.deployCheckWaitTime;

  startAndVerify(taskList, appName, appRemote, port, deployCheckWaitTime);

  return taskList;
};

function installStud(taskList) {
  taskList.executeScript('Installing Stud', {
    script: path.resolve(SCRIPT_DIR, 'install-stud.sh')
  });
}

function copyEnvVars(taskList, env, appName, appRemote) {
  var env = _.clone(env);
  // sending PORT to the docker container is useless.
  // It'll run on PORT 80 and we can't override it
  // Changing the port is done via the start.sh script
  delete env.PORT;
  taskList.copy('Sending environment variables', {
    src: path.resolve(TEMPLATES_DIR, 'env.list'),
    dest: appRemote + '/'+appName + '/config/env.list',
    vars: {
      env: env || {},
      appName: appName,
      appRemote: appRemote
    }
  });
}

function startAndVerify(taskList, appName, appRemote, port, deployCheckWaitTime) {
  taskList.execute('Starting app', {
    command: "bash " + appRemote + '/'+appName + "/config/start.sh"
  });

  // verifying deployment
  taskList.executeScript('Verifying deployment', {
    script: path.resolve(SCRIPT_DIR, 'verify-deployment.sh'),
    vars: {
      deployCheckWaitTime: deployCheckWaitTime || 10,
      appName: appName,
      appRemote: appRemote,
      port: port
    }
  });
}

function deployAndVerify(taskList, appName, appRemote, port, deployCheckWaitTime) {
  // deploying
  taskList.executeScript('Invoking deployment process', {
    script: path.resolve(SCRIPT_DIR, 'deploy.sh'),
    vars: {
      appName: appName,
      appRemote: appRemote
    }
  });

  // verifying deployment
  taskList.executeScript('Verifying deployment', {
    script: path.resolve(SCRIPT_DIR, 'verify-deployment.sh'),
    vars: {
      deployCheckWaitTime: deployCheckWaitTime || 10,
      appName: appName,
      appRemote: appRemote,
      port: port
    }
  });
}
