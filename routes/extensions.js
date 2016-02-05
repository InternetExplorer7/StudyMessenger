var groupModel = require('../models/group');
var Promise = require('bluebird');
exports.showGroups = function(api, message) {
        Promise.try(function() {
                return groupModel.find();
        }).then(function(allGroups) {
                if (allGroups.length === 0) { // No groups found
                        api.sendMessage("Sorry, no groups were found.", message.threadID);
                } else { // groups were found, loop through all groups
                        allGroups.forEach(function(group, index) {
                                api.sendMessage("[ " + index + " ] " + group.name + ": " + (group.participants.length - 1) + " members.", message.threadID)
                        });
                }
        })
}


exports.getHelp = function(api, message) {
        api.sendMessage("Hey " + message.senderName.substring(0, message.senderName.indexOf(" ")) + ", here are current commands you can use: \n @list: gets the current list of groups. \n @create lets you create your own group!", message.threadID);
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
                                        api.sendMessage("Thanks for creating a group, since we are in Beta, please note a few things. ...", message.threadID);
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
                if (!isNaN(parseInt(message.body.substring(message.body.indexOf(" "))))) { // is a number
                        return allData[parseInt(message.body.substring(message.body.indexOf(" ")))]
                } else {
                	api.sendMessage("Please make sure to enter the number of the group you want to join, and not the name! e.g. @join 7. NOT @join precalc2", message.threadID);
                }
        }).then(function(group) {
                if (group && group.participants.indexOf(message.senderID) === -1) { // group is found, but user is not (Good, means that user isn't in group)
                        api.addUserToGroup(message.senderID, group._id);
                        group.participants.push(message.senderID) // add user to document
                        group.save(); // save
                        api.sendMessage("Welcome " + message.senderName.substring(0, message.senderName.indexOf(" ")) + " to the group! Since we are in beta, please use @leave if you decide to leave a group.\n Keep in mind, once you leave a group, you can NOT join back! ", group._id);
                } else if(group && group.participants.indexOf(message.senderID) !== -1){ // group was valid and user was found in group. 
                        api.sendMessage("You've already joined that group!", message.threadID);
                } else {
                		api.sendMessage("I couldn't quite find that group!", message.threadID);
                }
        });
}