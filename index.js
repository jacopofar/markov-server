'use strict';
var express = require('express');
var MarkovModel = require('./model');
var SQLItePersistor = require('./SQLItePersistor');
var bodyParser = require('body-parser');
var nconf = require('nconf');

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
writeApp.use(bodyParser.raw({type: function(){return true;}}));

var models = {};

writeApp.post('/chains/:name/learn', function(req, res, next) {
  function isValidUTF8(buf){
    return Buffer.compare(new Buffer(buf.toString(),'utf8') , buf) === 0;
  };
  console.log('---------------------\n'+req.body+'\n----------------------');
  console.log("content type: "+req.get('Content-Type'));
  if(typeof models[req.params.name] === 'undefined'){
    models[req.params.name] = new MarkovModel(new SQLItePersistor(req.params.name));
  }
  var mm = models[req.params.name];
  var toLearn;
  if(req.get('Content-Type') === 'application/x-www-form-urlencoded'){
    toLearn = req.body.toString().split(' ');
    console.log("toLearn: "+JSON.stringify(toLearn));
    //TODO manage utf8 errors
  }
  //TODO manage undefined toLearn, meaning the message was not processed
  mm.learn(toLearn);
  res.send('hello ' + req.params.name);
  next();
});

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
    metaDataServer = metaDataApp.listen(nconf.get('metaDataPort') , function () {
      var host = metaDataServer.address().address;
      var port = metaDataServer.address().port;
      console.log('metadata API listening at http://%s:%s', host, port);
    });
  }
}
