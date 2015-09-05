'use strict';
var nconf = require('nconf');
global.nconf = nconf;
//command line parameters have priority over environment variables
nconf.argv().env();
nconf.defaults({
  writePort : 3000,
  metaDataPort : 3001,
  readPort : 3002,
  postgresConnString : 'postgres://postgres:mysecretpassword@127.0.0.1/postgres',
  maxPendingInsertions : 5,
  CORS: true
});

var express = require('express');
var bodyParser = require('body-parser');
var PostgresPersistor = require('./PostgresPersistor');


var writeApp = express();
var readApp;
var metaDataApp;
writeApp.use(bodyParser.raw({type: function(){return true;}, limit : '4mb'}));

global.models = {};
global.meta = {
  pendingInsertions:0
};
global.persistService = PostgresPersistor;

var writeServer = writeApp.listen(nconf.get('writePort'), function () {
  var host = writeServer.address().address;
  var port = writeServer.address().port;
  console.log('write API listening at http://%s:%s', host, port);
});

if(nconf.get('readPort') == nconf.get('writePort')){
  readApp = writeApp;
  console.log('read API using the same port of the write API');
}
else{
  readApp = express();
  var readServer = readApp.listen(nconf.get('readPort') , function () {
    var host = readServer.address().address;
    var port = readServer.address().port;
    console.log('read API listening at http://%s:%s', host, port);
  });
}

if(nconf.get('metaDataPort') == nconf.get('writePort')){
  metaDataApp = writeApp;
  console.log('metadata API using the same port of the write API');
}
else{
  if(nconf.get('metaDataPort') == nconf.get('readPort')){
    metaDataApp = readApp;
    console.log('metadata API using the same port of the read API');
  }
  else{
    metaDataApp = express();
    var metaDataServer = metaDataApp.listen(nconf.get('metaDataPort') , function () {
      var host = metaDataServer.address().address;
      var port = metaDataServer.address().port;
      console.log('metadata API listening at http://%s:%s', host, port);
    });
  }
}
if(nconf.get('CORS')){
  console.log("allowing cross origin requests");
  var CORSHeaderAdder = function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  };
  writeApp.use(CORSHeaderAdder);
  writeApp.use(CORSHeaderAdder);
  metaDataApp.use(CORSHeaderAdder);
}

writeApp.post('/chains/:name/learn',require('./endpoints/learn.js'));
writeApp.post('/chains/:name/learn_batch',require('./endpoints/learn_batch.js'));
readApp.post('/chains/:name/continue/',require('./endpoints/continue.js'));
