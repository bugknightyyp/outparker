var crypto = require('crypto')
var async = require('async')
var _ = require('lodash-node')
var ObjectID = require('mongodb').ObjectID
var userCol = require('../db').getCollection('user')
var followCol = require('../db').getCollection('follow')
var util = require('../util')

var img = require('../img')


var Activity = function () {}



