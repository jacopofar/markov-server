'use strict';
var MarkovModel = require('../model');
var error_sender = require('../helpers/format_errors');
var isValidUTF8 = function(buf){
  if(!Buffer.compare){
    //see https://github.com/jxcore/jxcore/issues/523
    console.warn("Buffer.compare not available, maybe you are using jxcore? In that case could be an old version");
    return true;
  }
  return Buffer.compare(new Buffer(buf.toString(),'utf8') , buf) === 0;
};
module.exports = function(req, res, next) {
  if(meta.pendingInsertions > nconf.get('maxPendingInsertions')){
    error_sender(res,'too many requests',429);
    console.log("server overloaded with "+meta.pendingInsertions+" insertions, the limit is "+nconf.get('maxPendingInsertions')+" refusing new ones waiting...");
    return;
  }
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
    if(data.window_size){
      toLearn = data.sequences.map(function(el){
        return mm.aggregateStates(el,data.window_size,true);
      });
    }
    else{
    toLearn = data.sequences;
  }
    //console.log("toLearn: "+JSON.stringify(toLearn));
  }
  if(typeof toLearn === 'undefined'){
    error_sender(res,'unknown Content-Type, cannot process',400);
    return;
  }
  console.log("batch insertion requested, "+meta.pendingInsertions+" pending...");
  meta.pendingInsertions++;
  var numInserts = mm.learn_batch(toLearn,function(result){
    if(result.aborted){
      console.log(new Date().toISOString() + " - batch insertion FAILED");
      res.status(500).json({error:"database error while inserting the data, retry"});
      return;
    }
    console.log(new Date().toISOString() + " - batch inserted: "+result.totalInserts);
    res.json({transitions: result.totalInserts });
  });

};
