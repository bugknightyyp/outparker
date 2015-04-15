var router = require('express').Router()
var async = require('async')

var sms = require('../models').sms

router.post('/phone/:phone_number/vc', function(req, res) {
	var params = {}
	params.phoneNumber = req.params.phone_number
	async.waterfall([
			function (callback) {
				var err = null
				if (!/^\d{11}$/.test(params.phoneNumber)) {
					err = '手机号码错误'
				}
				callback(err)
			},
			function (callback) {
				sms.postValidCodeTOPhone(params, callback)
			}
		], function (err, data) {
			var rslt = {}
			if (err) {
				rslt.ok = 0
				rslt.msg = err
			} else {
				rslt.ok = 1
				rslt.result = {}
				rslt.result.phone_number = data.phone_number
				rslt.result.create_date = data.create_date

				req.session[req.cookies.session_id] = data 
			}
			res.json(rslt)
		})
})

module.exports = router; 