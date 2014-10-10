var Etcd = require('node-etcd');
var Utils = require('util');
var _ = require('lodash');
var _s = require('underscore.string');
var exec = require('child_process').exec;

var fs = require('fs');
var Handlebars = require('handlebars');

var etcd = new Etcd();

var source = fs.readFileSync(__dirname + "/template.hbl", {encoding: "UTF8"});
var template = Handlebars.compile(source);

var configPath = "/etc/nginx/sites-enabled/default";
var self_host = process.env.LISTEN_HOST + ":" + process.env.LISTEN_PORT;

console.log("Self listen host: ", self_host);

try {
  fs.unlinkSync(configPath);
} catch (e) {
  console.log("Config file already had been removed.");
}

function renderConfig (callback) {
  etcd.get("/ide", {recursive: true}, function(f, resp){

    var ides = resp.node.nodes.map(function(node){

      var port  =  _.find(node.nodes, function(i){
        return _s.endsWith(i.key, "/port");
      })

      if(!port) {
        console.log("Can't find port for key: ", node.key);
        return undefined;
      }

      var port9000  =  _.find(port.nodes, function(i){
        return _s.endsWith(i.key, "/9000");
      })

      if(!port9000) {
        console.log("Can't find 9000 port for key: ", node.key);
        return undefined;
      }

      return { url: node.key, host: port9000.value };
    })

    var context = { ides: _.compact(ides), self_host: self_host };

    console.log("Context: ", context);

    callback(template(context));
  });
}

function killHupNginx() {
  exec("docker kill --signal HUP nginx", function(error, stdout, stderr) {
    console.log("HUP signal sended to nginx. ");
    console.log("\tSTDOUT: ", stdout);
    console.log("\tSTDERR: ", stderr);
    if(error !== null) { console.log("Something went wrong with exec."); }
  });
}

function updateConfig(data) {
  fs.writeFileSync(configPath, data);
  killHupNginx();
}

function onKeyChange(){
  renderConfig(updateConfig);
}

onKeyChange();

var watcher = etcd.watcher("/ide", null, {recursive: true});
watcher.on("change", onKeyChange);
