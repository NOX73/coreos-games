var Etcd = require('node-etcd');
var Utils = require('util');
var fs = require('fs');
var Handlebars = require('handlebars');
var _ = require('lodash');
var _s = require('underscore.string');

var etcd = new Etcd();

var source = fs.readFileSync(__dirname + "/template.hbl", {encoding: "UTF8"});
var template = Handlebars.compile(source);

var configPath = "/etc/nginx/sites-enabled/default";

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

    var context = { ides: _.compact(ides) };

    console.log("Context: ", context);

    callback(template(context));
  });
}

function updateConfig(data) {
  fs.writeFileSync(configPath, data);
}

function onKeyChange(){
  renderConfig(updateConfig);
}

onKeyChange();

var watcher = etcd.watcher("/ide", null, {recursive: true});
watcher.on("change", onKeyChange)

console.log("Done");
