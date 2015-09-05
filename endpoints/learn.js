'use strict';
var MarkovModel = require('../model');
var error_sender = require('../helpers/format_errors');

module.exports = function(req, res, next) {
  if(meta.pendingInsertions > nconf.get('maxPendingInsertions')){
    error_sender(res,'too many requests',429);
    console.log("server overloaded, refusing new insertions...");
    return;
  }
  function isValidUTF8(buf){
    return Buffer.compare(new Buffer(buf.toString(),'utf8') , buf) === 0;
  };
  if(typeof models[req.params.name] === 'undefined'){
    models[req.params.name] = new MarkovModel(new global.persistService(req.params.name));
  }
  var mm = models[req.params.name];
  var toLearn;
  if(req.get('Content-Type') === 'application/x-www-form-urlencoded' || req.get('Content-Type') === 'text/plain;charset=UTF-8'){
    if(!isValidUTF8(req.body)){
      error_sender(res,'invalid UTF-8',422);
      return;
    }
    toLearn = req.body.toString().split(' ');
    //console.log("toLearn: "+JSON.stringify(toLearn));
  }
  if(req.get('Content-Type') === 'application/json'){
    if(!isValidUTF8(req.body)){
      error_sender(res,'invalid UTF-8',422);
      return;
    }
    var data = JSON.parse(req.body.toString());
    if(!Array.isArray(data.sequence)){
      error_sender(res,'the sequence field has to be present and be an array',400);
      return;
    }
    toLearn = data.sequence;
    //console.log("toLearn: "+JSON.stringify(toLearn));
  }
  if(typeof toLearn === 'undefined'){
    error_sender(res,'unknown Content-Type, cannot process',400);
    return;
  }
  meta.pendingInsertions++;
  mm.learn(toLearn,function(learnResult){
    res.json(learnResult);
  });
};
