'use strict';
var pg = require('pg');
var MarkovModel = require('./model');

// a string like postgres://username:password@localhost/database
var connString = nconf.get('postgresConnString');

/**
* cb will be called with the client and the done function to call when done to release it
*/
var getClient = function(cb){
  pg.connect(connString, function(err,client, done) {
    if(err) {
      throw new Error('error fetching client from pool'+err);
    }
    cb(client,done);
});
};

getClient(function(client,done){
  client.query('CREATE TABLE IF NOT EXISTS transitions(modelname VARCHAR(50), sstart text, send text, count INTEGER, CONSTRAINT pk PRIMARY KEY (modelname,sstart,send));',
  function(err, result) {
    if(err) {
      return console.error('error initializing the database:', err);
    }

    client.query("CREATE INDEX IF NOT EXISTS id1 ON transitions(modelname,sstart)");

    var query = client.query("SELECT DISTINCT modelname AS modelname FROM transitions");
    query.on('row', function(row) {
      if(typeof   models[row.modelname] === 'undefined'){
        models[row.modelname] = new MarkovModel(new global.persistService(row.modelname));
        console.log("loaded model " + row.modelname);
      }
    });
    query.on('end', function(result) {
      done();
    });
  });

});

var PostgresPersistor = function(name){
  this.name = name;
};

PostgresPersistor.prototype.addTransitions = function(toAdd, endOp){
  getClient(function(client,done){
    var totalInserts = 0;
    var aborted = false;
    client.query('BEGIN',function(begin_err){
      Object.keys(toAdd).forEach(function(s){
        Object.keys(toAdd[s]).forEach(function(e){
          if(!aborted){
            client.query("INSERT INTO transitions VALUES ($1,$2,$3,$4) ON CONFLICT ON CONSTRAINT pk DO UPDATE SET count = EXCLUDED.count + $4",
            [this.name,s,e,toAdd[s][e]],
            function(error,results){
              if(aborted){
                return;
              }
              totalInserts++;
              if(error && !aborted){
                aborted = true;
                console.log("error during INSERT: "+error);
                client.query('ROLLBACK', function() {
                  client.end();
                });
              }
              //  console.log(this.name +":inserted "+s+" --> "+e+"("+toAdd[s][e]+")");
            }.bind(this));
          }
        }.bind(this));
      }.bind(this));
      if(aborted){
        done();
        meta.pendingInsertions--;
        console.log("INSERTION ABORTED - pending number is now "+meta.pendingInsertions);
        endOp({aborted: true});
      }
      client.query('COMMIT',function(begin_err){
        done();
        meta.pendingInsertions--;
        console.log("pending number is now "+meta.pendingInsertions);
        endOp({totalInserts : totalInserts, aborted : false});
      });
    }.bind(this));
  }.bind(this));
};


PostgresPersistor.prototype.getSuccessors = function(state,callback){
  var retVal = {};
  var err = null;
  getClient(function(client,done){

    var query = client.query("SELECT send,count FROM transitions WHERE sstart = $1 AND modelname = $2",[state, this.name]);
    query.on('row', function(row) {
      retVal[row.send] = row.count;
    });
    query.on('end', function(result) {
      done();
      callback(err,retVal);
    });
  }.bind(this));
};

PostgresPersistor.prototype.successorsTotal = function(state,callback){
  var retVal = {};
  var err = null;
  getClient(function(client,done){
    var query =  client.query("SELECT SUM(count) AS count FROM transitions WHERE sstart = $1 AND modelname = $2",[state, this.name]);
    query.on('row', function(row) {
      done();
      callback(null,row.count);
    });
  }.bind(this));



};
module.exports = PostgresPersistor;
