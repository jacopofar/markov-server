
require('../index');
var assert = require("assert");
var should = require('should');
var MarkovModel = require('../model');
var Persistor = require('../PostgresPersistor');
/*
global.nconf = nconf;
nconf.argv().env();
nconf.defaults({
writePort : 3000,
metaDataPort : 3001,
readPort : 3002,
postgresConnString : 'postgres://postgres:mysecretpassword@172.17.0.12/postgres'
});
*/



describe('MarkovModel', function() {
  describe('learn', function () {
    it('should return only successors among the given ones', function (done) {
      var mm = new MarkovModel(new Persistor('test1'));
      mm.learn_batch([['a','b'],['a','b'],['a','b'],['a','CIRCUS']],function(){
        mm.successors('a',function(err,data){
          data.should.have.property(JSON.stringify('b'));
          data.should.have.property(JSON.stringify('CIRCUS'));
          data.should.not.have.property(JSON.stringify('a'));
        });
        done();
      });
    });

    it('should work with orders greater than 1', function (done) {
      var mm = new MarkovModel(new Persistor('test2'));
      mm.learn(mm.aggregateStates('12345678901234567890'.split(''),4),function(addResult){
        console.log("ADD RESULT: "+JSON.stringify(addResult));
        mm.successors('1234'.split(''),function(err,data){
          console.log("DATA: "+JSON.stringify(data));
          data.should.have.property(JSON.stringify('2345'.split('')));
          data.should.not.have.property(JSON.stringify('5'));
          data.should.not.have.property(JSON.stringify('6'));
          data.should.not.have.property(JSON.stringify('4'));
          done();
        });
      });
    })
  });

  describe('stress', function () {
    it('should be able to give multiple successors', function (done) {
      var mm = new MarkovModel(new Persistor('test3'));
      mm.learn(mm.aggregateStates(('Modern discussions of alchemy are generally split into an examination of its exoteric practical '+
      'applications and its esoteric aspects. The former is pursued by historians of the physical sciences who have examined the subject '+
      'in terms of protochemistry, medicine, and charlatanism. The latter interests psychologists, spiritual and new age communities, hermetic philosophers, and historians of esotericism.'
    ).split(''),2),function(){
      //con 3000 va in 58 secondi
      //3500 in 61
      //4000 in 62
      //10000 in 62
      //20000 in 102
      mm.multipleSuccessors(1000,'de'.split(''),function(err,seq){
        if(err){
          console.log("error:"+JSON.stringify(err));
        }
        seq.should.not.be.null();
        console.log(seq.map(function(v){return v[0]}).join(''));
        done();
      });
    });
  });


  it('should be able to work with a long text page and never hang generating using the padding', function (done) {
    this.timeout(20000000);
    require('fs').readFile('wiki_electric_vehicle.txt',{encoding:'utf8'},function(err,data){
      var mm = new MarkovModel(new Persistor('test4'));
      mm.learn(mm.aggregateStates(data.replace('\n','').split(' '),2,true),function(){
        //10000 in 11
        //20000 in 17
        //100000 in 1325
        mm.multipleSuccessors(20000,[null,null],function(err,seq){
          seq.length.should.equal(20000);
          if(err){
            console.log("error:"+JSON.stringify(err));
          }
          seq.should.not.be.null();
          var longResult = seq.map(function(v){return v[0]}).join(' ');
          console.log(longResult.substr(1,300)+ "\n ... \n"+longResult.substr(-300));
          done();
        });
      });
    });
  });
});
});
