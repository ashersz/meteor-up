var cjson = require('cjson');
var path = require('path');
var fs = require('fs');
var helpers = require('./helpers');
var format = require('util').format;

require('colors');

exports.read = function(configFileName) {
  var mupJsonPath = path.resolve(configFileName);
  // path of the mup.json file is the basedir and everything
  // will be based on that path

  if(fs.existsSync(mupJsonPath)) {
    var mupJson = cjson.load(mupJsonPath);

    //initialize options
    mupJson.env = mupJson.env || {};

    if(typeof mupJson.setupNode === "undefined") {
      mupJson.setupNode = true;
    }
    if(typeof mupJson.setupPhantom === "undefined") {
      mupJson.setupPhantom = true;
    }
    mupJson.meteorBinary = (mupJson.meteorBinary) ? getCanonicalPath(mupJson.meteorBinary) : 'meteor';
    if(typeof mupJson.appName === "undefined") {
      mupJson.appName = "meteor";
    }
    if(typeof mupJson.appRemote === "undefined"){
      mupJson.appRemote = "/var/www"
    }
    if(typeof mupJson.appLog === "undefined"){
      mupJson.appLog = "/var/log/meteor.log"
    }
    if(typeof mupJson.appUser === "undefined"){
      mupJson.appUser = "meteoruser"
    }
    if(typeof mupJson.enableUploadProgressBar === "undefined") {
      mupJson.enableUploadProgressBar = true;
    }
    // build environment variables
    mupJson.build_env = mupJson.build_env || {};

    //validating servers
    if(!mupJson.servers || mupJson.servers.length == 0) {
      mupErrorLog('Server information does not exist');
    } else {
      mupJson.servers.forEach(function(server) {
        var sshAgentExists = false;
        var sshAgent = process.env.SSH_AUTH_SOCK;
        if(sshAgent) {
          sshAgentExists = fs.existsSync(sshAgent);
          server.sshOptions = server.sshOptions || {};
          if (server.os !== "centos"){
              server.sshOptions.agent = sshAgent;
          }
        }

        if(!server.host) {
          mupErrorLog('Server host does not exist');
        } else if(!server.username) {
          mupErrorLog('Server username does not exist');
        } else if(!server.password && !server.pem && !sshAgentExists) {
          mupErrorLog('Server password, pem or a ssh agent does not exist');
        } else if(!mupJson.app) {
          mupErrorLog('Path to app does not exist');
        }

        server.os = server.os || "linux";

        if(server.pem) {
          server.pem = rewriteHome(server.pem);
        }

        server.env = server.env || {};
        var defaultPort = mupJson.env['PORT'] === 3000?80:mupJson.env['PORT'];
        var defaultEndpointUrl =
          format("http://%s:%s", server.host, defaultPort);
        server.env['CLUSTER_ENDPOINT_URL'] =
          server.env['CLUSTER_ENDPOINT_URL'] || defaultEndpointUrl;
        console.log("CLUSTER_ENDPOINT_URL="+server.env['CLUSTER_ENDPOINT_URL']);  
      });
    }

    //rewrite ~ with $HOME
    mupJson.app = rewriteHome(mupJson.app);

    if(mupJson.ssl) {
      mupJson.ssl.backendPort = mupJson.ssl.backendPort || 80;
      mupJson.ssl.pem = path.resolve(rewriteHome(mupJson.ssl.pem));
      if(!fs.existsSync(mupJson.ssl.pem)) {
        mupErrorLog('SSL pem file does not exist');
      }
    }

    return mupJson;
  } else {
    console.error('mup.json file does not exist!'.red.bold);
    helpers.printHelp();
    process.exit(1);
  }
};

function rewriteHome(location) {
  if(/^win/.test(process.platform)) {
    return location.replace('~', process.env.USERPROFILE);
  } else {
    return location.replace('~', process.env.HOME);
  }
}

function mupErrorLog(message) {
  var errorMessage = 'Invalid mup.json file: ' + message;
  console.error(errorMessage.red.bold);
  process.exit(1);
}

function getCanonicalPath(location) {
  var localDir = path.resolve(__dirname, location);
  if(fs.existsSync(localDir)) {
    return localDir;
  } else {
    return path.resolve(rewriteHome(location));
  }
}
