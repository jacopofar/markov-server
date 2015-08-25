var restify = require('restify');
var MarkovModel = require('./model');
var SQLItePersistor = require('./SQLItePersistor');

var server = restify.createServer();
var models = {};
server.post('/chains/:name/learn', function(req, res, next) {
  console.log(req);
  if(typeof models[req.params.name] === 'undefined'){
    models[req.params.name] = new MarkovModel(new SQLItePersistor(req.params.name));
  }
  var mm = models[req.params.name];
  mm.learn(JSON.parse(req.body).values);
  res.send('hello ' + req.params.name);
  next();
});

server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});
