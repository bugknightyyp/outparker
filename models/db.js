
var config = require('../config').db;
var _ = require('lodash-node');
var util = require('util');

var paramStr = ''

_.each(config.options, function(key, val){
   paramStr += (value + "=" + name + "&")
});

paramStr = paramStr.slice(0, -1);
if (paramStr) {
  paramStr = '?' + paramStr
}
var dbURL = util.format('mongodb://%s:%s/%s%s', config.host, config.port, config.dbName, paramStr)

var 
    MongoClient = require('mongodb').MongoClient
    // Server = require('mongodb').Server,
    // ReplSetServers = require('mongodb').ReplSetServers,
    // ObjectID = require('mongodb').ObjectID,
    // Binary = require('mongodb').Binary,
    // GridStore = require('mongodb').GridStore,
    // Grid = require('mongodb').Grid,
    // Code = require('mongodb').Code,
    // BSON = require('mongodb').pure().BSON,
    // assert = require('assert');

exports.dbURL = dbURL;
exports.MongoClient = MongoClient;
exports.getCollection = function(collectionName){
  return function(callback){
    MongoClient.connect(dbURL,function(err, db){
      if (err){
        callback(err)
      } else {
        db.collection(collectionName, callback)
      }
    })
  }
}

