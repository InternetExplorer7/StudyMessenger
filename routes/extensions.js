var groupModel = require('../models/group');
var Promise = require('bluebird');
var wit = require('node-wit');
var witData = require('./wit');
exports.showGroups = function(api, message) {
        Promise.try(function() {
                return groupModel.find();
        }).then(function(allGroups) {
                if (allGroups.length === 0) { // No groups found
                        // api.sendMessage("Sorry, no groups were found.", message.threadID);
                        return "Sorry, no groups were found."
                } else { // groups were found, loop through all groups
                	var buildup = "";
                	console.log('buildup orign: ' + buildup);
                        allGroups.forEach(function(group, index) {
                        	console.log('buildup each: ' + buildup);
                        	buildup += (index + 1) +  ". " + group.name + " currently has " + (group.participants.length - 1) + " members.\n";
                                //api.sendMessage(index + ". " + group.name + " currently has " + (group.participants.length - 1) + " members.", message.threadID)
                        });
                        return buildup;
                }
        }).then(function (messageToSend){
        	api.sendMessage(messageToSend, message.threadID);
        });
}


exports.getHelp = function(api, message) {
        api.sendMessage("Hey " + message.senderName.substring(0, message.senderName.indexOf(" ")) + ", here are current commands you can use:\n@list: gets the current list of groups.\n@create: lets you create your own group!\n@leave: Exits you from a group chat (If you plan on leaving a group, please use this!)", message.threadID);
}

exports.createGroup = function(api, message) {
	var name = message.body.substring(message.body.indexOf(" "));
	name = name.trim();
        var newGroup = new groupModel({
                _id: message.threadID,
                name: name,
                participants: []
        })
        api.setTitle(name, message.threadID, function(err) {
                if (err) {
                        api.sendMessage("Whoops, make sure that you're in a group chat with another person, and then use @create in that group!", message.threadID);
                } else {
                        Promise.try(function() {
                                return groupModel.findById(message.threadID);
                        }).then(function(oneModel) {
                                if (oneModel) { // rename probably
                                        oneModel.name = name;
                                        oneModel.save();
                                } else { // brand new group
                                        newGroup.participants = message.participantIDs;
                                        newGroup.save();
                                        api.sendMessage("Thanks for creating a group, since we are in Beta, please note a few things.\n1. Please don't kick other members from the group. If someone's exhibiting poor behavior, plese contact one of the admins.\n2. Don't add anyone to the group, if someoone wants to join, tell them to ask the bot, which will automatically add them to the group!\n3.We are new, spread the word and tell your friends about us!", message.threadID);
                                }
                        })
                }
        });
}

exports.leaveGroup = function (api, message){
	api.removeUserFromGroup(message.senderID, message.threadID, function (err){
		if(err){
			api.sendMessage("hmm, something went wrong and you can't leave this chat.\nKeep in mind, you can only leave group chats.", message.threadID);
		} else {
			Promise.try(function () {
				return groupModel.findById(message.threadID);
			}).then(function (oneModel) {
				if(oneModel){
					oneModel.participants.splice(oneModel.participants.indexOf(message.senderID), 1);
					oneModel.save();
				} else {
					api.sendMessage("Sorry, something went wrong here.", message.threadID);
					console.log('Error exiting group: ' + message.threadID);
				}
			});
		}
	});
}


exports.joinGroup = function(api, message) {
	var name = message.body.substring(message.body.indexOf(" "));
	name = name.trim();
        Promise.try(function() {
                return groupModel.find();
        }).then(function(allData) {
        	if (!isNaN(parseInt(message.body.substring(message.body.indexOf(" "))))) { // body is a number. e.g. 1, 2, 3..
                return allData[parseInt(message.body.substring(message.body.indexOf(" "))) - 1] // Edit, subtracted 1 to user input. 0 -> 1, 1 -> 2
        	} else { // Could be a group name, check.
        		return searchForGroup_internal(message, allData);
        	}
        }).then(function(group) {
        	console.log(JSON.stringify(group));
                if (group && group.participants.indexOf(message.senderID) === -1) { // group is found, but user is not (Good, means that user isn't in group)
                        api.addUserToGroup(message.senderID, group._id);
                        group.participants.push(message.senderID) // add user to document
                        group.save(); // save
                        api.sendMessage("Welcome " + message.senderName.substring(0, message.senderName.indexOf(" ")) + " to the group! Since we are in beta, please use @leave if you decide to leave a group.\n Keep in mind, once you leave a group, you can NOT join back! ", group._id);
                } else if(group && group.participants.indexOf(message.senderID) !== -1){ // group was valid and user was found in group. 
                        api.sendMessage("You've already joined that group!", message.threadID);
                } else {
                		api.sendMessage("I couldn't find that group, use @help if you're looking for help.", message.threadID);
                }
        }).catch(function (e){
        	console.error(e);
        	api.sendMessage("Whoops, something went wrong! This error has been noted!", message.threadID);
        });
}
/*
If the user didn't enter an index, this function will check to see if they entered a group name.
If not, it'll return null.
If so, It'll return a group.
*/
function searchForGroup_internal(message, allData) {
	var groupName;
	return Promise.try(function () {
		return witData.wit(message);
	}).then(function (witResponse){
		groupName = witResponse;
		return allData;
	}).filter(function (group){
		if(group.name === groupName){
			return true;
		} else {
			return false;
		}
	}).then(function (newGroup){
		if(newGroup){ // Document was found
			return newGroup[0]
		} else {
			return null;
		}
	}).catch(function (e){
		console.error(e);
	});
}