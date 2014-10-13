var exec = require('child_process').exec;
var express = require('express');
var app = express();
var _ = require('lodash');
var moment = require('moment');

var ide_num = 1;

var ides =[];
var base_host = "ide.hexlet.io";

app.post('/', function (req, res) {
  var my_num = ide_num;
  ide_num++;

  console.log("New IDE request.");

  exec("fleetctl load ide-discovery@"+my_num+".service", function(error, stdout, stderr) {
    if(error) console.log("Loading ide-discory failed: ", stderr);
  });

  exec("fleetctl load ide@"+my_num+".service", function(error, stdout, stderr) {
    if(error) {
      console.log("Loading ide failed: ", stderr);
    } else {
      exec("fleetctl start ide@"+my_num+".service", function(error, stdout, stderr) {
        if(error) console.log("Starting ide failed: ", stderr);
        ides.push({start: moment(), idx: my_num});
      });
    };
  });

  res.json({url: "http://ide"+my_num+"."+base_host});
})

function dropDownIde (idx) {
  console.log("Shutdowning ide: ", idx);

  exec("fleetctl stop ide@"+idx+".service", function(error, stdout, stderr) {
    if(error) console.log("Stopping ide #"+idx+" failed: ", stderr);
  });
}

function checkOldIdes () {
  console.log("Checking for old ides. Count:", ides.length);
  ides = _.filter(ides, function(item) {


    if(moment().diff(item.start, 'minutes') > 5) {
      dropDownIde(item.idx);
      return false;
    } else {
      return true;
    }

  });
  console.log("Old ides checked. Count:", ides.length);
}

setInterval(checkOldIdes, 1000 * 60);

app.listen(process.env.LISTEN_PORT, process.env.LISTEN_HOST);
