var exec = require('child_process').exec;
var express = require('express');
var app = express();

var ide_num = 1;

app.post('/ide', function (req, res) {
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
      });
    };
  });

  res.json({url: "/ide/ide_"+my_num+"/"});
})

app.listen(process.env.LISTEN_PORT, process.env.LISTEN_HOST);
