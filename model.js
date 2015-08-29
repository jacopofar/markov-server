var MM = function(service){
  this.persistService = service;
  this.complete = false;
};

/**
* Update edge counts based on the array of symbols.
* Each symbol is stringified and an edge is created between the strings, so numbers, null, arrays and objects are accepted
* Nothing is done here to manage delimiters, the caller could add null values for that
*/
MM.prototype.learn = function(array){
  var toAdd = {};
  var total = 0;
  for(var i=1; i<array.length; i++){
    var start = JSON.stringify(array[i-1]);
    var end = JSON.stringify(array[i]);
    if(typeof toAdd[start] === 'undefined'){
      toAdd[start] = {};
    }
    total++;
    toAdd[start][end] = 1 + (toAdd[start][end]||0);
  }
  this.persistService.addTransitions(toAdd);
  return total;
};

/**
* Update edge counts based on multiple arrays of symbols.
* It produces the same result of calling learn() on each array, but can be faster
* Each symbol is stringified and an edge is created between the strings, so numbers, null, arrays and objects are accepted
* Nothing is done here to manage delimiters, the caller could add null values for that
*/
MM.prototype.learn_batch = function(array_of_arrays){
  var toAdd = {};
  var total = 0;
  for(var j=1; j<array_of_arrays.length; j++){
    var array = array_of_arrays[j];
    for(var i=1; i<array.length; i++){
      var start = JSON.stringify(array[i-1]);
      var end = JSON.stringify(array[i]);
      if(typeof toAdd[start] === 'undefined'){
        toAdd[start] = {};
      }
      total++;
      toAdd[start][end] = 1 + (toAdd[start][end]||0);
    }
  }
  this.persistService.addTransitions(toAdd);
  return total;
};

/**
* Return the list of successors of a given state
* The state is stringified beforehand, so numbers, null, arrays and objects can be used
* The callback is called with an error value and an object with the results as the keys and their counts as values
*/
MM.prototype.successors = function(state, callback){
  this.persistService.getSuccessors(JSON.stringify(state),callback);
};

/**
* Return the total amount of successors of a given state (that is, the sum of the counts of all of the successors)
* The state is stringified beforehand, so numbers, null, arrays and objects can be used
* The callback is called with an error value and the total
*/
MM.prototype.successorsTotal = function(state, callback){
  this.persistService.successorsTotal(JSON.stringify(state),callback);
};
/**
* Return a random successor of a given state
* The state is stringified beforehand, so numbers, null, arrays and objects can be used
* The callback is called with an error value and the next successor
*/
MM.prototype.randomSuccessor = function(state,callback){
  this.successorsTotal(state, function(err,total){
    if(err){
      callback(err);
    }
    else{
      var chosen = Math.floor(Math.random()*total)+1;
      this.successors(state,function(err,successors){
        if(err){
          callback(err);
        }
        else{
          if(Object.keys(successors).length === 0){
            callback({error:"the initial state is unknown or has no successors",state:state});
            return;
          }
          var keys = Object.keys(successors);
          for(var i=0;i<keys.length;i++){
            chosen -= successors[keys[i]];
            if(chosen<=0){
              callback(null,JSON.parse(keys[i]));
              return;
            }
          }
        }
        //callback(null,Object.keys(successors))
      }.bind(this));
    }

  }.bind(this));
};

/**
* Get a random sequence of states after the given one, just like calling randomSuccessor iteratively.
*/
MM.prototype.multipleSuccessors = function(num,curState,cb,curSequence){
  this.randomSuccessor(curState,function(err,value){
    if(err){
      cb(err,curSequence);
      return;
    }
    if(typeof curSequence === 'undefined') curSequence = [];
    if(num > 0){
      setImmediate(function(){this.multipleSuccessors(num-1,value,cb,curSequence.concat([curState]));}.bind(this));
    }
    else {
      cb(null,curSequence);
    }
  }.bind(this));
};

/**
* creates aggregate states. padding=true means that on the array edges null values are added to let the window slide
*/
MM.prototype.aggregateStates = function(array,window_size,padding){
  if(typeof this.order === 'number'){
    if(window_size !== this.order){
      return new Error("invalid order, this model has order "+this.order+" but was requested aggregation with window_size "+window_size);
    }
  }
  if(padding === true){
    var pads = [];
    for(var i=0;i<=window_size;i++)
    pads.push(null);
    return pads.concat(array).concat(pads).map(function(item,index,array){
      if(index + window_size < array.length){
        return array.slice(index,index + window_size);
      }
    }).filter(function(u){return typeof u !== 'undefined'});
  }
  return array.map(function(item,index,array){
    if(index + window_size < array.length){
      return array.slice(index,index + window_size);
    }
  }).filter(function(u){return typeof u !== 'undefined'});
}

module.exports = MM;
