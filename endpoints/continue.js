'use strict';
var error_sender = require('../helpers/format_errors');
var isValidUTF8 = function(buf){
  return Buffer.compare(new Buffer(buf.toString(),'utf8') , buf) === 0;
};
//chains/:name/continue/:startstate/:num
module.exports = function(req, res, next) {

  if(typeof models[req.params.name] === 'undefined'){
    error_sender(res,'unknowkn model '+req.params.name,400);
    return;
  }
  var mm = models[req.params.name];

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
    mm.multipleSuccessors(data.number,data.sequence,function(err,seq){
      if(err && !err.endOfChain){
        error_sender(res,"error"+err,400);
        return;
      }
      res.json(seq);
    });
  }
};
