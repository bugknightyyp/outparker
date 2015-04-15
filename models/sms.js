var util = require('util')
var https = require('https')
var crypto = require('crypto')
var moment = require('moment')

var router = require('express').Router();


var config = {}
	config.accountId = '65924dd16c9b3bdcf0fb693ea1abd487'
	config.appId = 'b8d2f890ee0843c483582ddf0307ad42'
	config.authTocken = '39ee828c25c3afd530de88dd5536c666'

exports.postValidCodeTOPhone = function(params, callback){
	var tempPath = '/%s/Accounts/%s/Messages/templateSMS?sig=%s'
	var timestamp = moment().format('YYYYMMDDHHmmss')
	var number = Math.floor(Math.random() * 1000000)
	var sig = crypto.createHash('md5')
					.update(config.accountId)
					.update(config.authTocken)
					.update(timestamp)
					.digest('hex')
					.toUpperCase()
	var data = {
		"templateSMS": {
			"appId": config.appId,
			"param": number,
			"templateId": "3490",
			"to": params.phoneNumber
		}

	}

	data = JSON.stringify(data)

	var options = {
		hostname: 'api.ucpaas.com',
		path: util.format(tempPath,'2014-06-30', config.accountId, sig),
		method: 'post'
	}
	var headers = {
		"Content-Type": "application/json;charset=utf-8",
		"Accept": "application/json",
		"Content-Length": data.length,
		"Authorization": new Buffer(config.accountId + ':' + timestamp).toString('base64')

	}

	options.headers = headers

	var req = https.request(options, function(res){
		res.on('data', function(buffer) {
			var rslt = JSON.parse(buffer.toString())
			if (rslt.resp.respCode == '000000') {
				callback(null, {
									number: number,
									phone_number: params.phoneNumber, 
									create_date: rslt.resp.templateSMS.createDate
								})	
			} else {
				callback('发送失败')	
			}
			
		})
	})
	req.on('error', function(e) {
	  callback(err)
	})
	req.write(data)
	req.end()
}

