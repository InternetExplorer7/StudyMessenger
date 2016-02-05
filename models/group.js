var mongoose = require('mongoose');

// Create the Schema
var contactSchema = new mongoose.Schema({
		_id: Number, // GrouID for groups. threadID
		name: String,
		participantCount: Number
});

// create the model
module.exports = mongoose.model('groups', contactSchema);