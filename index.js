'use strict';
var express = require('express');
var bodyParser = require('body-parser');
var nconf = require('nconf');
var SQLItePersistor = require('../SQLItePersistor');

//command line parameters have priority over environment variables
nconf.argv().env();
nconf.defaults({
  writePort : 3000,
  metaDataPort : 3001,
  readPort : 3002
});

var writeApp = express();
var readApp;
var metaDataApp;
writeApp.use(bodyParser.raw({type: function(){return true;}, limit : '500kb'}));

global.models = {};
global.persistService = SQLItePersistor;
global.nconf = nconf;

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
writeApp.post('/chains/:name/learn',require('./endpoints/learn.js'));
writeApp.post('/chains/:name/learn_batch',require('./endpoints/learn_batch.js'));
