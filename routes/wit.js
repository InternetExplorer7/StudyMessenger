var wit = require('node-wit');

exports.wit = function (message){
	return new Promise(function (resolve, reject) {
		return wit.captureTextIntent("KEY", message.body, function (err, res){
			if(err) reject(err);
			if(res.outcomes[0].entities.group_name){ // Value found
				resolve(res.outcomes[0].entities.group_name[0].value);
			} else {
				reject(err);
			}
		});
	});
}