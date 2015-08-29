'use strict';
var MarkovModel = require('../model');
var error_sender = require('../helpers/format_errors');

module.exports = function(req, res, next) {
  function isValidUTF8(buf){
    return Buffer.compare(new Buffer(buf.toString(),'utf8') , buf) === 0;
  };
  if(typeof models[req.params.name] === 'undefined'){
    models[req.params.name] = new MarkovModel(new global.persistService(req.params.name));
  }
  var mm = models[req.params.name];
  var toLearn;

  if(req.get('Content-Type') === 'application/json'){
    if(!isValidUTF8(req.body)){
      error_sender(res,'invalid UTF-8',422);
      return;
    }
    var data = JSON.parse(req.body.toString());
    if(!Array.isArray(data.sequences)){
      error_sender(res,'the sequences field has to be present and be an array of arrays',400);
      return;
    }
    for(var j=1; j<data.sequences.length; j++){
      if(!Array.isArray(data.sequences[j])){
        error_sender(res,'the sequences field has to be an array of arrays, element '+j+' was not an array',400);
        return;
      }
    }
    toLearn = data.sequences;
    //console.log("toLearn: "+JSON.stringify(toLearn));
  }
  if(typeof toLearn === 'undefined'){
    error_sender(res,'unknown Content-Type, cannot process',400);
    return;
  }
  console.log("batch requested...");
  var numInserts = mm.learn_batch(toLearn);
  console.log(new Date().toISOString() + " - batch inserted: "+numInserts);
  res.json({transitions: numInserts });
};
