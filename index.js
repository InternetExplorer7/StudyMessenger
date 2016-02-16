var express = require('express');

var app = express();

var login = require('facebook-chat-api');

var routes = require('./routes/routes');

var Promise = require('bluebird');

var mongoose = require('bluebird').promisifyAll(require('mongoose'));

var bodyParser = require('body-parser');

var user = require('./models/user.js');

var cfenv = require('cfenv');
// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();


mongoose.connect("mongodb://localhost:27017/bcmessenger");

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

login({ email: "email", password: "pass"},
	function (err, api){
		if (err) return console.error(err);
		api.listen(function (err, message){
			Promise.try(function () {
				routes.checkUser(api, message);
				routes.checkMessage(api, message);
			}).catch(function (e){
				console.error(e);
			});
		})
	});

app.listen(3000);