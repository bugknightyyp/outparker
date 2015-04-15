var router = require('express').Router();
var user = require('../../models/').user();
var config = require('../../config');
var ObjectID = require('mongodb').ObjectID
var async = require('async')
var _ = require('lodash-node')

//删除用户通过手机号
/*router.delete('/phone/:phone_number', function(req, res){
  var params = {}
  params.phone = req.params.phone_number
  async.waterfall([
      function(callback){
        var err = null
        if(!/^\d{11}$/.test(params.phone)){
          err = '手机格式有误'
        }
        callback(err)
      },
      function(callback){
         user.deleteUserByPhone(params, callback)
      }
    ], function(err, data){
      var rslt = {};
      if (err) {
        rslt.ok = 0
        rslt.msg = err
      } else if (data.result.n == 0){
        rslt.ok = 0
        rslt.msg = '该号码还没注册'
      } else {
        rslt.ok = 1
      }
      res.json(rslt)
    })

  
})*/

//注册
router.post('/signup', function(req, res){
  var tmpUser = {}
  tmpUser.phone = _.isString(tmpUser.phone)? req.body.phone.trim() : req.body.phone
  tmpUser.pwd = _.isString(tmpUser.pwd)? req.body.pwd.trim() : req.body.pwd
  tmpUser.auth_code = _.isString(tmpUser.auth_code)? req.body.auth_code.trim() : req.body.auth_code
  
  req.session[req.cookies.session_id] = req.session[req.cookies.session_id] || {}
  var auth_code = '' + req.session[req.cookies.session_id].number 
  async.waterfall([
  function(callback){
    var err = null
    if(!/^\d{11}$/.test(tmpUser.phone)){
      err = '手机格式有误'
    } else if (tmpUser.pwd.length <= 6){
      err = '密码长度必须大于6'
    } else if (tmpUser.auth_code != auth_code){
      err = '手机验证码错误'
    }
    callback(err)
  },
  function(callback){
    user.findUserByPhone(tmpUser.phone, function(err, user){
      if (err) {
        callback(err)
      } else if (user) {
        callback('该手机号码已经注册过')
      } else {
        callback(null)
      }
    })
  }, 
  function(callback){
    user.addUser({phone: tmpUser.phone, pwd: tmpUser.pwd}, callback)
  }], 

  function(err, data){
      var rslt = {};
      if (err) {
        rslt.ok = 0
        rslt.msg = err
      } else {
        rslt.ok = 1
        res.cookie('user_id', data.insertedId.toString(), { domain: config.cookie.domain,  maxAge: 1000 * 60 * 60 * 24 * 30, httpOnly: false})
      }
      res.json(rslt)
  })
  
})
//Reset password
router.put('/user/reset-pwd', function (req, res) {
  var params = {}
  params.phone = _.isString(params.phone)? req.body.phone.trim() : req.body.phone
  params.pwd = _.isString(params.pwd)? req.body.pwd.trim() : req.body.pwd
  params.auth_code = _.isString(params.auth_code)? req.body.auth_code.trim() : req.body.auth_code
  
  req.session[req.cookies.session_id] = req.session[req.cookies.session_id] || {}
  var auth_code = '' + req.session[req.cookies.session_id].number 
  async.waterfall([
  function(callback){
    var err = null
    if(!/^\d{11}$/.test(params.phone)){
      err = '手机格式有误'
    } else if (params.pwd.length < 6){
      err = '密码长度必须大于6'
    } else if (params.auth_code != auth_code){
      err = '手机验证码错误'
    }
    callback(err)
  },
  function(callback){
    user.findUserByPhone(params.phone, function(err, user){
      if (err) {
        callback(err)
      } else if (!user) {
        callback('该手机号码还没有注册')
      } else {
        params._id = user._id.toString()
        callback(null, user)
      }
    })
  }, 
  function(tmpUser, callback){
    user.resutUserPwd({_id: tmpUser._id, pwd: params.pwd}, callback)
  }], function(err, data){
      var rslt = {};
      if (err) {
        rslt.ok = 0
        rslt.msg = err
      } else {
        rslt.ok = 1
        res.cookie('user_id', params._id, { domain: config.cookie.domain,  maxAge: 1000 * 60 * 60 * 24 * 30, httpOnly: false})
      }
      res.json(rslt)
  })
})
//登录
router.post('/user/signin', function(req, res){
  var tmpUser = {}
  tmpUser.phone = _.isString(tmpUser.phone)? req.body.phone.trim() : req.body.phone
  tmpUser.pwd = _.isString(tmpUser.pwd)? req.body.pwd.trim() : req.body.pwd
  

  async.waterfall([
      function(callback){
        var err = null
        if(!/^\d{11}$/.test(tmpUser.phone)){
          err = '手机格式有误'
        } else if (tmpUser.pwd.length < 6){
          err = '密码长度必须大于6'
        }
        callback(err)
      },
      function(callback){
         user.findUserByPhone(tmpUser.phone, callback)
      }
    ], 
    function(err, user){
      var rslt = {};
      if (err) {
        rslt.ok = 0
        rslt.msg = err
      } else if(!user){
        rslt.ok = 0
        rslt.msg = '该号码没注册'
      }else if (tmpUser.phone != user.phone || tmpUser.pwd != user.pwd) {
        rslt.ok = 0
        rslt.msg = '手机号码或密码不正确'
      } else {
        rslt.ok = 1
        res.cookie('user_id', user._id.toString(), { domain: config.cookie.domain,  maxAge: 1000 * 60 * 60 * 24 * 30, httpOnly: false})
      }
      res.json(rslt)
    })
 
})

//退出登录
router.delete('/user/signout', function(req, res){
  var rslt = {};

  req.session.regenerate(function(err) {
    if (err) {
      rslt.ok = 0
      rslt.msg = err
    } else {
      rslt.ok = 1
      res.cookie('user_id', '', { domain: config.cookie.domain,  maxAge: 0})
    }
    res.json(rslt)
  })
})
//获取用户基本信息
router.get('/user/:user_id', function(req, res){
  var params = {}
  params._id = req.params.user_id
  params.user_loged_id = req.cookies.user_id
  async.waterfall(
    [
      function(callback){
        var err = null
        try{
          params._id = new ObjectID(params._id || '')
        } catch (errs){
          err = 'user_id不正确'
        }

        callback(err)
      },

      function(callback){
        user.userBasicInfo(params, callback)
      }
    ],
    function(err, user){
      var rslt = {}
      if (err) {
        rslt.ok = 0
        rslt.msg = err
      } else {
        rslt.ok = 1
        rslt.result = user
      }
      res.json(rslt)
    })
})
//性别 sex
router.put('/user/sex', function(req, res){
  var params = {}
  params.user_id = new ObjectID(req.cookies.user_id)
  params.sex = req.body.sex
  user.setSex(params, function(err, doc){
    var rslt = {}
    if (err) {
      rslt.ok = 0
      rslt.msg = err
    } else if(doc == 0) {
      rslt.ok = 0
      rslt.msg = '该用户不存在'
    } else {
      rslt.ok = 1
    }
    res.json(rslt)
  })
})
//地址address
router.put('/user/address', function(req, res){
  var params = {}
  params.user_id = new ObjectID(req.cookies.user_id)
  params.address = req.body.address
  user.setAddress(params, function(err, doc){
    var rslt = {}
    if (err) {
      rslt.ok = 0
      rslt.msg = err
    } else if (doc == 0){
      rslt.ok = 0
      rslt.msg = '该用户不存在'
    } else {
      rslt.ok = 1
    }
    res.json(rslt)
  })
})
//头像portrait
router.put('/user/portrait', function(req, res){

   var params = {}
  params.id = req.params.user_id || req.cookies.user_id
  
  async.waterfall(
    [
      function(callback){
        var err = null
        try{
          params._id = new ObjectID(params.id || '')
        } catch (errs){
          err = 'user_id不正确'
        }
        params.oFile =  req.files.portrait
        if (!_.isObject(params.oFile)) {
          err = 'portrait文件不正确'
        }
        callback(err)
      },
      function(callback){
        user.setPortrait(params, callback)
      }
    ], function(err, doc){
      var rslt = {}
      if (err) {
        rslt.ok = 0
        rslt.msg = err
      } else if (doc == 0){
        rslt.ok = 0
        rslt.msg = '该用户不存在'
      } else {
        rslt.ok = 1
        rslt.result = {}
        rslt.result.portrait = req.files.portrait.name
      }
      res.json(rslt)
    })
})
//个性签名 motto
router.put('/user/motto', function(req, res){
  var params = {}
  params.user_id = new ObjectID(req.cookies.user_id)
  params.motto = req.body.motto
  user.setMotto(params, function(err, doc){
    var rslt = {}
    if (err) {
      rslt.ok = 0
      rslt.msg = err
    } else if (doc == 0){
      rslt.ok = 0
      rslt.msg = '该用户不存在'
    } else {
      rslt.ok = 1
    }
    res.json(rslt)
  })
})
//昵称 nickname
router.put('/user/nickname', function(req, res){
  var params = {}
  params.user_id = new ObjectID(req.cookies.user_id)
  params.nickname = req.body.nickname
  user.setNickname(params, function(err, doc){
    var rslt = {}
    if (err) {
      rslt.ok = 0
      rslt.msg = err
    } else if (doc == 0){
      rslt.ok = 0
      rslt.msg = '该用户不存在'
    } else {
      rslt.ok = 1
    }
    res.json(rslt)
  })
})

//是否关注过某人
router.get('/user/:user_id/user-followed/:user_followed_id', function(req, res){
  var params = {}
  params.follower = req.params.user_id
  params.followed = req.params.user_followed_id

  async.waterfall(
    [
      function(callback){
        var err = null
        if (params.follower == params.followed) {
          err = '自己不能关注自己'
        } else if (!_.isString(params.follower)) {
          err = '用户没登陆'
        } else if (!_.isString(params.followed)) {
          err = '被关注者user_id有误'
        }
        callback(err)
      },
      function(callback){
        user.isFollow(params, callback)
      }
    ], function(err, doc){
      var rslt = {}
      if (err) {
        rslt.ok = 0
        rslt.msg = err
      } else {
        rslt.ok = 1
        rslt.result = doc
      }
      res.json(rslt)
    }) 
})

//关注用户
router.put('/user/:user_followed_id/follow', function(req, res){
  var params = {}
  params.follower = req.cookies.user_id
  params.followed = req.params.user_followed_id

  async.waterfall(
    [
      function(callback){
        var err = null
        if (params.follower == params.followed) {
          err = '自己不能关注自己'
        } else if (!_.isString(params.follower)) {
          err = '用户没登陆'
        } else if (!_.isString(params.followed)) {
          err = '被关注者user_id有误'
        }
        callback(err)
      },
      function(callback){
        user.follow(params, callback)
      }
    ], function(err, doc){
      var rslt = {}
      if (err) {
        rslt.ok = 0
        rslt.msg = err
      } else {
        rslt.ok = 1
        //rslt.result = doc
      }
      res.json(rslt)
    }) 
})

//取消关注用户
router.delete('/user/:user_followed_id/follow', function(req, res){
  var params = {}
  params.follower = req.cookies.user_id
  params.followed = req.params.user_followed_id

  async.waterfall(
    [
      function(callback){
        var err = null
        if (!_.isString(params.follower)) {
          err = '用户没登陆'
        } else if (!_.isString(params.followed)) {
          err = '被关注者user_id有误'
        }
        callback(err)
      },
      function(callback){
        user.deleteFollow(params, callback)
      }
    ], function(err, doc){
      var rslt = {}
      if (err) {
        rslt.ok = 0
        rslt.msg = err
      } else {
        rslt.ok = 1
        //rslt.result = doc
      }
      res.json(rslt)
    }) 
})
//获取某人的关注者
router.get('/user/:user_id/follows', function(req, res){

})
//获取某人的粉丝
router.get('/user/:user_id/followers', function(req, res){

})
module.exports = router;  