var nodemiral = require('nodemiral-forcetty');
var fs = require('fs');
var path = require('path');
var util = require('util');

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
      appRemote: config.appRemote
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
  var taskList = nodemiral.taskList("Deploy app '" + appName + "' (centos)");

  taskList.copy('Uploading bundle', {
    src: bundlePath,
    dest:  appRemote + '/'+appName+'/tmp/bundle.tar.gz',
    progressBar: enableUploadProgressBar
  });

  taskList.copy('Sending environment variables', {
    src: path.resolve(TEMPLATES_DIR, 'env.sh'),
    dest: appRemote + '/'+appName + '/config/env.sh',
    vars: {
      env: env || {},
      appName: appName
    }
  });
  taskList.copy('Sending start script', {
    src: path.resolve(TEMPLATES_DIR, 'start.sh'),
    dest: appRemote + '/'+appName + '/config/start.sh',
    vars: {
      env: env || {},
      appName: appName,
      appRemote: appRemote
    }
  });
  taskList.copy('Sending stop script', {
    src: path.resolve(TEMPLATES_DIR, 'stop.sh'),
    dest: appRemote + '/'+appName + '/config/stop.sh',
    vars: {
      appName: appName,
      appRemote: appRemote
    }
  });
  // deploying
  taskList.executeScript('Invoking deployment process', {
    script: path.resolve(TEMPLATES_DIR, 'deploy.sh'),
    vars: {
      deployCheckWaitTime: deployCheckWaitTime || 10,
      appName: appName,
      appRemote: appRemote
    }
  });

  return taskList;
};

exports.reconfig = function(env, appName,appRemote) {
  var taskList = nodemiral.taskList("Updating configurations (centos)");

  taskList.copy('Setting up Environment Variables', {
    src: path.resolve(TEMPLATES_DIR, 'env.sh'),
    dest: appRemote + '/'+appName + '/config/env.sh',
    vars: {
      env: env || {},
      appName: appName
    }
  });
  stop(taskList,appName,appRemote);
  start(taskList,env,appName,appRemote);

  return taskList;
};

exports.restart = function(env,appName,appRemote) {
  var taskList = nodemiral.taskList("Restarting Application (centos)");
  stop(taskList,appName,appRemote);
  start(taskList,env,appName,appRemote);
  return taskList;
};

exports.stop = function(appName,appRemote) {
  var taskList = nodemiral.taskList("Stopping Application (centos)");
  stop(taskList,appName,appRemote);
  return taskList;
};

exports.start = function(env,appName,appRemote) {
  var taskList = nodemiral.taskList("Starting Application (centos)");
  start(taskList,env,appName,appRemote);
  return taskList;
};
function stop(tasklist,appName,appRemote){
  // stopping
  taskList.executeScript('Stopping app', {
    script: path.resolve(TEMPLATES_DIR, 'stop.sh'),
    vars: {
      appName: appName,
      appRemote: appRemote
    }
  });
}
function start(tasklist,env,appName,appRemote){
  // starting
  taskList.executeScript('Starting app', {
    script: path.resolve(TEMPLATES_DIR, 'start.sh'),
    vars: {
      env: env || {},
      appName: appName,
      appRemote: appRemote
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
