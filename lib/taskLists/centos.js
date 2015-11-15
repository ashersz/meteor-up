var nodemiral = require('nodemiral-forcetty');
var fs = require('fs');
var path = require('path');
var util = require('util');
var _ = require('underscore');

var SCRIPT_DIR = path.resolve(__dirname, '../../scripts/centos');
var TEMPLATES_DIR = path.resolve(__dirname, '../../templates/centos');

exports.setup = function(config) {
  var taskList = nodemiral.taskList('Setup (Centos)');

  // Installation
  if(config.setupNode) {
    taskList.executeScript('Installing Node.js', {
      script: path.resolve(SCRIPT_DIR, 'install-node.sh'),
      vars: {
        nodeVersion: config.nodeVersion
      }
    });
  }

  if(config.setupPhantom) {
    taskList.executeScript('Installing PhantomJS', {
      script: path.resolve(SCRIPT_DIR, 'install-phantomjs.sh')
    });
  }

  taskList.executeScript('Setting up Environment', {
    script: path.resolve(SCRIPT_DIR, 'setup-env.sh'),
    vars: {
      appName: config.appName,
      appRemote: config.appRemote,
      appUser: config.appUser,
      appLog: config.appLog,
      appPort: config.appPort || 3000
    }
  });

  if(config.setupMongo) {
    taskList.copy('Copying MongoDB configuration', {
      src: path.resolve(TEMPLATES_DIR, 'mongodb.conf'),
      dest: '/etc/mongodb.conf'
    });

    taskList.executeScript('Installing MongoDB', {
      script: path.resolve(SCRIPT_DIR, 'install-mongodb.sh')
    });
  }

  if(config.ssl) {
    installStud(taskList);
    configureStud(taskList, config.ssl.pem, config.ssl.backendPort);
  }

  //Configurations
/*  taskList.copy('Configuring upstart', {
    src: path.resolve(TEMPLATES_DIR, 'meteor.conf'),
    dest: '/etc/init/' + config.appName + '.conf',
    vars: {
      appName: config.appName
    }
  });*/

  return taskList;
};

exports.deploy = function(bundlePath, env, config) {
  var deployCheckWaitTime = config.deployCheckWaitTime;
  var appName = config.appName;
  var enableUploadProgressBar = config.enableUploadProgressBar;
  var appRemote = config.appRemote;
  var appUser = config.appUser;
  var appLog = config.appLog;
  var taskList = nodemiral.taskList("Deploy app '" + appName + "' (centos)");

  taskList.execute('Allow current user to copy to ' + appRemote + '/'+ appName, {
		command: 'sudo chown -R ${USER}:${USER} ' + appRemote + '/' + appName
	});

  taskList.copy('Uploading bundle', {
    src: bundlePath,
    dest:  appRemote + '/'+appName+'/tmp/bundle.tar.gz',
    progressBar: enableUploadProgressBar
  });

  copyEnvVars(taskList, env, appName, appRemote);

  copyConfigure(taskList, env, appName, appRemote, appUser, appLog, config.env['METEOR_SETTINGS']);

  // deploying
  taskList.executeScript('Invoking deployment process', {
    script: path.resolve(TEMPLATES_DIR, 'deploy.sh'),
    vars: {
      appName: appName,
      appRemote: appRemote,
      appUser: appUser,
      appLog: appLog
    }
  });

  start(taskList, appName, appRemote, deployCheckWaitTime, env.PORT);

  return taskList;
};

exports.reconfig = function(env, appName, appRemote, appUser, appLog, meteor_settings) {
  var taskList = nodemiral.taskList("Updating configurations (centos)");

  copyEnvVars(taskList, env, appName, appRemote);
  copyConfigure(taskList, env, appName, appRemote, appUser, appLog, meteor_settings);
  start(taskList, appName, appRemote, deployCheckWaitTime, env.PORT);

  return taskList;
};

exports.restart = function(appName) {
  var taskList = nodemiral.taskList("Restarting Application (centos)");
  taskList.execute('Restarting ' + appName + ' daemon...', {
		command: 'sudo systemctl restart ' + appName + '.service'
	});
  return taskList;
};

exports.stop = function(appName) {
  var taskList = nodemiral.taskList("Stopping Application (centos)");
  taskList.execute('Stopping ' + appName + ' daemon...', {
		command: 'sudo systemctl stop ' + appName + '.service'
	});
  return taskList;
};

exports.start = function(env,appName,appRemote) {
  var taskList = nodemiral.taskList("Starting Application (centos)");
  taskList.execute('Starting ' + appName + ' daemon...', {
		command: 'sudo systemctl start ' + appName + '.service'
	});
  return taskList;
};

function copyEnvVars(tasklist, env, appName, appRemote) {
  var env = _.clone(env);
  tasklist.copy('Sending environment variables', {
    src: path.resolve(TEMPLATES_DIR, 'env.sh'),
    dest: appRemote + '/'+appName + '/config/env.sh',
    vars: {
      env: env || {},
      appName: appName
    }
  });
}

function copyConfigure(tasklist, env, appName, appRemote, appUser, appLog, meteor_settings) {
  // scp the systemd template to server
  // we are sudo but not root
  // will move later to /etc/systemd/system
  var env = _.clone(env);
  tasklist.copy('Configuring systemd daemon...', {
    src: path.resolve(TEMPLATES_DIR, 'noded.conf'),
    dest: appRemote + '/'+appName +  '/'+appName +'.service',
    vars: {
      appRootUrl: env.ROOT_URL || "127.0.0.1",
      appPort: env.PORT || "3000",
      appMongoUrl: env.MONGO_URL || ('mongodb://127.0.0.1:27017/' + appName),
      appUser: appUser,
      env: meteor_settings || "",
      appName: appName,
      appRemote: appRemote,
      appLog: appLog
    }
  });
}
function start(tasklist, appName, appRemote, deployCheckWaitTime, appPort){
  // start
  tasklist.executeScript('Invoking start process', {
    script: path.resolve(TEMPLATES_DIR, 'start.sh'),
    vars: {
      deployCheckWaitTime: deployCheckWaitTime || 10,
      appName: appName,
      appRemote: appRemote,
      appPort: appPort || "3000",
    }
  });
}
function installStud(taskList) {
  taskList.executeScript('Installing Stud', {
    script: path.resolve(SCRIPT_DIR, 'install-stud.sh')
  });
}

function configureStud(taskList, pemFilePath, port) {
  var backend = {host: '127.0.0.1', port: port};

  taskList.copy('Configuring Stud for Upstart', {
    src: path.resolve(TEMPLATES_DIR, 'stud.init.conf'),
    dest: '/etc/init/stud.conf'
  });

  taskList.copy('Configuring SSL', {
    src: pemFilePath,
    dest: '/opt/stud/ssl.pem'
  });


  taskList.copy('Configuring Stud', {
    src: path.resolve(TEMPLATES_DIR, 'stud.conf'),
    dest: '/opt/stud/stud.conf',
    vars: {
      backend: util.format('[%s]:%d', backend.host, backend.port)
    }
  });

  taskList.execute('Verifying SSL Configurations (ssl.pem)', {
    command: 'stud --test --config=/opt/stud/stud.conf'
  });

  //restart stud
  taskList.execute('Starting Stud', {
    command: '(sudo stop stud || :) && (sudo start stud || :)'
  });
}
