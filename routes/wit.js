var wit = require('node-wit');

exports.wit = function (message){
	return new Promise(function (resolve, reject) {
		return wit.captureTextIntent("WITAIKEY", message.body, function (err, res){
			if(res.outcomes[0].entities.group_name){ // Value found
				resolve(res.outcomes[0].entities.group_name[0].value);
			} else if(err || !res.outcomes.entities.group_name){
				reject(err);
			}
		});
	});
}