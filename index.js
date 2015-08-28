var express = require('express');
var app = express();
var MarkovModel = require('./model');
var SQLItePersistor = require('./SQLItePersistor');
var bodyParser = require('body-parser');
//server.on('uncaughtException',function(a){console.log(a)});
app.use(bodyParser.raw({ type: function(){
  return true;
} }));

var models = {};
app.post('/chains/:name/learn', function(req, res, next) {
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

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
