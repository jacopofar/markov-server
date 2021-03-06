var sqlite3 = require("sqlite3").verbose();
var deasync = require('deasync');

var SQLItePersistor = function(name){
  console.error("WARNING: this persistor has performance and stability issues, it's still a work in progress");
  this.name = name;
  var fileName = name+".db";
  var exists = require('fs').existsSync(fileName);
  this.db = new sqlite3.Database(fileName);
  if(!exists) {
    //the constructor will end only when the tables and indexes are created
    var syncrun = deasync(function(sql,cb){
      this.db.run(sql,cb);
    }.bind(this));
    syncrun("CREATE TABLE transitions (start TEXT, end TEXT, count INTEGER, CONSTRAINT pk PRIMARY KEY (start,end))");
    syncrun("CREATE INDEX transitions_idx ON transitions(start)");
  }
  process.on('exit', function () {
    console.log("exiting, closing the db...");
    this.db.close();
  }.bind(this));
};

SQLItePersistor.prototype.addTransitions = function(toAdd){
  //  this.db.serialize(function(){
  try{
    this.db.run("BEGIN");
  }
  catch(ex){
    console.log("error when opening the transaction: "+ex);
  }
  Object.keys(toAdd).forEach(function(s){
    Object.keys(toAdd[s]).forEach(function(e){
      this.db.run("INSERT OR REPLACE INTO transitions VALUES ($start,$end,\
        (SELECT COALESCE(SUM(count) + $increment,$increment) FROM transitions WHERE start = $start AND end = $end))",
        {$start:s,$end:e,$increment:toAdd[s][e]},
        function(error){
          if(error){
            console.log("error during INSERT:"+error);
          }
          //  console.log(this.name +":inserted "+s+" --> "+e+"("+toAdd[s][e]+")");
        }.bind(this));
      }.bind(this));
    }.bind(this));

    try{
      this.db.run("COMMIT");
    }
    catch(ex){
      console.log("error when closing the transaction: "+ex);
    }
    meta.pendingBatchInsertions--;
    //  }.bind(this));
  };


  SQLItePersistor.prototype.getSuccessors = function(state,callback){
    var retVal = {};
    var err = null;
    this.db.each("SELECT end,count FROM transitions WHERE start = ?",[state],function(err_row,row){
      if(err_row){
        err=err_row;
      }
      retVal[row.end] = row.count;
    },
    function(){
      callback(err,retVal);
    }.bind(this));
  };

  SQLItePersistor.prototype.successorsTotal = function(state,callback){
    var retVal = {};
    var err = null;
    this.db.get("SELECT SUM(count) AS total FROM transitions WHERE start = ?",[state],function(err_row,row){
      callback(err_row,err_row ? null : row.total);
    });
  };
  module.exports = SQLItePersistor;
