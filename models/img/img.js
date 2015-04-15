var path = require('path')
var os = require('os')
var crypto = require('crypto')
var fs = require('fs')
var async = require('async')
var _ = require('lodash-node')
var oss = require('../oss').getOss()
/*buffer: null
encoding: "7bit"
extension: "mp4"
fieldname: "txt-name-haha"
mimetype: "video/mp4"
name: "2e8d525e1ace3e61df6f075e970e5d98.mp4"
originalname: "miaopai0725.mp4"
path: "uploads\2e8d525e1ace3e61df6f075e970e5d98.mp4"
size: 5804236
truncated: fal*/
exports.saveImgToOss = function(oFile, callback){
  var videoSrcFile = path.join(process.cwd(), oFile.path)
  oss.putObject({
      bucket: 'shanhaijing-1',
      object: oFile.name,
      srcFile: videoSrcFile
    }, function(err, result) {
      callback(err, result)
    })
}