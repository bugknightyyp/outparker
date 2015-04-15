var crypto = require('crypto')
var async = require('async')
var _ = require('lodash-node')
var ObjectID = require('mongodb').ObjectID
var userCol = require('../db').getCollection('user')
var followCol = require('../db').getCollection('follow')
var util = require('../util')

var img = require('../img')
var User = function(){}


var proto = User.prototype;

proto.addUser = function(user, callback){

  user.create_time =  util.getGMTSeconds()

  var taskList = []

  taskList.push(userCol)
  taskList.push(function(col, callback){
    col.insertOne(user, {w:1}, callback)
  })
  async.waterfall(taskList,callback)
}
proto.resutUserPwd = function (user, callback) {
  async.waterfall([
      userCol,
      function (col, callback) {
        col.update({_id: user._id}, {$set:{pwd: user.pwd}}, {w: 1}, callback)
      }
    ], callback)
  
}
proto.getUserInfoByIDs = function(user_ids, callback){
  var taskList = []

  taskList.push(userCol)
  taskList.push(function(col, callback){
    col.find({_id: {$in: user_ids}}, {fields:{phone:1, sex: 1, nickname: 1, address: 1, portrait: 1, motto: 1}}).toArray(callback)
  })
  async.waterfall(taskList, callback)
}

proto.userBasicInfo = function(params, callback){
  async.waterfall([
      userCol,
      function(col, callback){
        col.findOne({_id: params._id}, {fields:{
          phone:1, 
          sex: 1, 
          nickname: 1, 
          address: 1, 
          portrait: 1, 
          motto: 1, 
          followed: 1,
          uped: 1,
          collected: 1,
          followed_by_other: 1
        }}, callback)
      },
      function(user, callback){
        if (user == null) {
          callback(null, null)
          return
        }
        async.waterfall([
            followCol,
            function(col, callback){
              var _id = crypto.createHash('md5').update(params._id.toString()).update(params.user_loged_id || '').digest('hex')
              col.findOne({_id: _id}, function(err, doc){
                if (err) {
                  callback(err)
                } else {
                  user.isFollowed = !!doc
                  callback(null, user)
                }
              })
            }
          ], callback)
      }

    ], callback)
}
proto.findUserByPhone = function(phone, callback){
  var taskList = []

  taskList.push(userCol)
  taskList.push(function(col, callback){
    col.findOne({phone: phone}, {fields:{phone: 1, pwd: 1}}, callback)
  })
  async.waterfall(taskList,callback)
}
proto.setSex= function(params, callback){
  var taskList = []

  taskList.push(userCol)
  taskList.push(function(col, callback){
    col.update({_id: params.user_id}, {$set:{sex: params.sex}}, callback)
  })
  async.waterfall(taskList,callback) 
}
proto.setAddress= function(params, callback){
  var taskList = []

  taskList.push(userCol)
  taskList.push(function(col, callback){
    col.update({_id: params.user_id}, {$set:{address: params.address}}, callback)
  })
  async.waterfall(taskList,callback) 
}
proto.setPortrait= function(params, callback){
  var taskList = []
  taskList.push(function(callback){
    img.saveImgToOss(params.oFile, callback)
  })

  taskList.push(function(callback){
    async.waterfall([
      userCol,
      function(col, callback){
        col.update({_id: params._id}, {$set:{portrait: params.oFile.name}}, callback)
      }
    ], callback) 
  })
  

  async.parallel(taskList, callback)
}
proto.setMotto= function(params, callback){
  var taskList = []

  taskList.push(userCol)
  taskList.push(function(col, callback){
    col.update({_id: params.user_id}, {$set: {motto: params.motto}}, callback)
  })
  async.waterfall(taskList, callback) 
}
proto.setNickname= function(params, callback){
  var taskList = []

  taskList.push(userCol)
  taskList.push(function(col, callback){
    col.update({_id: params.user_id}, {$set: {nickname: params.nickname}}, callback)
  })
  async.waterfall(taskList,callback) 
}

function getUsersByIDs(ids, params, callback){

  ids = _.map(ids, function(item){
    return new ObjectID(item)
  })

  async.waterfall([
      userCol,
      function(col, callback){
        col.find({_id: {$in: ids}}, {fields: params.fields})
          .toArray(function(err, docs){
            callback(err, docs)
          })
      }
    ], callback)
}
proto.getUsersByIDs = getUsersByIDs

//是否关注过某人
function isFollow(params, callback){
  params._id = crypto.createHash('md5').update(params.followed).update(params.follower).digest('hex')
  async.waterfall(
    [
      followCol,
      function(col, callback){
        col.findOne({_id: params._id}, callback)
      }
    ],callback)
}
proto.isFollow = isFollow

//关注用户
proto.follow = function(params, callback){
  params.create_time = util.getGMTSeconds()
  params._id = crypto.createHash('md5').update(params.followed).update(params.follower).digest('hex')
  async.waterfall(
    [
      followCol,
      function(col, callback){
        col.findOne({_id: params._id}, function(err, doc){
          if (err) {
            callback(err)
          } else if (doc) {
            callback('已关注')
          } else {
            callback(null, col)
          }
              
        })
      },
      function(col, callback){
        col.insert(_.pick(params, '_id', 'create_time'), callback)
      }
    ], function(err, doc){

      callback(err, doc)

      if (!doc) return
      //更新用户表的用户followed 计数
      async.waterfall([
          userCol,
          function(col, callback){
            col.update({_id: new ObjectID(params.follower)}, {"$inc": {"followed": 1}}, callback)
          }
        ], function(err, doc){})

       //更新用户表的用户粉丝计数
      async.waterfall([
          userCol,
          function(col, callback){
            col.update({_id: new ObjectID(params.followed)}, {"$inc": {"followed_by_other": 1}}, callback)
          }
        ], function(err, doc){})

    })
}

//取消关注用户
proto.deleteFollow = function(params, callback){
  params.create_time = util.getGMTSeconds()
  params._id = crypto.createHash('md5').update(params.followed).update(params.follower).digest('hex')
  async.waterfall(
    [
      followCol,
      function(col, callback){
        col.findOne({_id: params._id}, function(err, doc){
          if (err) {
            callback(err)
          } else if (!doc) {
            callback('不存在关注关系')
          } else {
            callback(null, col)
          }
              
        })
      },
      function(col, callback){

        col.remove(_.pick(params, '_id'), callback)
        
      }
    ], function(err, doc){
       callback(err, doc)

      if (!doc) return
      //更新用户表的用户followed 计数
      async.waterfall([
          userCol,
          function(col, callback){
            col.update({_id: new ObjectID(params.follower)}, {"$inc": {"followed": -1}}, callback)
          }
        ], function(err, doc){})

       //更新用户表的用户粉丝计数
      async.waterfall([
          userCol,
          function(col, callback){
            col.update({_id: new ObjectID(params.followed)}, {"$inc": {"followed_by_other": -1}}, callback)
          }
        ], function(err, doc){})

    })
}
//通过手机号码删除用户
proto.deleteUserByPhone = function(params, callback){
  async.waterfall([
      userCol,
      function(col, callback){
        col.remove(_.pick(params, 'phone'), callback)
      }
    ], callback)
}
exports = module.exports = function(){
  return new User();
};