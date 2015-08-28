'use strict';
var MarkovModel = require('../model');
var SQLItePersistor = require('../SQLItePersistor');

module.exports = function(req, res, next) {
  function isValidUTF8(buf){
    return Buffer.compare(new Buffer(buf.toString(),'utf8') , buf) === 0;
  };
  console.log("\n\n content type: "+req.get('Content-Type'));
  if(typeof models[req.params.name] === 'undefined'){
    models[req.params.name] = new MarkovModel(new SQLItePersistor(req.params.name));
  }
  var mm = models[req.params.name];
  var toLearn;
  if(req.get('Content-Type') === 'application/x-www-form-urlencoded'){
    if(!isValidUTF8(req.body)){
      res.status(422).json();
    }
    toLearn = req.body.toString().split(' ');
    console.log("toLearn: "+JSON.stringify(toLearn));
  }
  //TODO manage undefined toLearn, meaning the message was not processed
  //TODO create helper to manage the accept header
  mm.learn(toLearn);
  res.json({transitions:toLearn.length});
};
