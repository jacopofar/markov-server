'use strict';
module.exports = function(res,error_message,http_status){
  res.format({
  'text/plain': function(){
    res.status(http_status).send(error_message);
  },
  'text/html': function(){
    res.status(http_status).send(error_message);
  },
  'application/json': function(){
    res.status(http_status).json({ error: error_message });
  },
  'default': function() {
    res.status(406).send('cannot write with the requested format, additionally we got the error '+http_status+' - '+error_message);
  }
});
};
