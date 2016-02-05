var mongoose = require('mongoose');

// Create the Schema
var contactSchema = new mongoose.Schema({
		_id: Number, // userID
		name: String
});

// create the model
module.exports = mongoose.model('users', contactSchema);