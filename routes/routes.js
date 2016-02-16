var model = require('../models/user.js');
var Promise = require('bluebird');
var mongoose = require('mongoose');
var wit = require('node-wit');
var extensions = require('./extensions');
exports.checkUser = function (api, message){
	Promise.try(function () {
		return model.findById(message.senderID); // replace thread id with user id
	}).then(function (oneModel) {
		console.log('oneModeL ' + oneModel);
		if(!oneModel){
			var newUser = new model({
				_id: message.senderID,
				name: message.senderName
			});
			newUser.save();
			var welcomeMessage = "";
			welcomeMessage += "Hey, I see that you're messaging in for the first time. Since it's your first time, I'll send you a list of currently running classes.\n\n";
			welcomeMessage += "To pull up this list again in the future, just use @list.\n\n"
			welcomeMessage += "If you ever get lost, use @help.\n\n"
			welcomeMessage += "If you want to join a group, give me the group number or group name, and I'll automatically add you to it!\n\n"
			welcomeMessage += "Don't see the group you're looking for? Make it by using @create group_name. e.g. @create Calc4 or @create Computer Science 210\n\n"
			api.sendMessage(welcomeMessage, message.threadID);
			setTimeout(function () {
				extensions.showGroups(api, message);
			}, 2000)
		}
	}).catch(function (e){
		console.error(e);
	});
}

exports.checkMessage = function (api, message){
	if(message.body.toLowerCase() === "@help"){
		extensions.getHelp(api, message);
	} else if(message.body.toLowerCase() === "@list"){
		extensions.showGroups(api, message);
	} else if(message.body.toLowerCase().includes("@create")){
		if(message.body.length > 7){
			extensions.createGroup(api, message);
		} else { // body.length < 7, name not given.
			api.sendMessage("Please make sure to give a group name, e.g. @create calc4 or @create cs210", message.threadID);
		}
	} else if(message.body.toLowerCase().includes("@join")){
		extensions.joinGroup(api, message);
	} else if(message.body.toLowerCase().includes("@leave")){
		extensions.leaveGroup(api, message)
	}
}

