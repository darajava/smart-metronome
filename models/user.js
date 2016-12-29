
var mongoose = require('mongoose');

module.exports = mongoose.model('User',{
  google: {id: String},
  email: String,
  name: String,
  image: String
});
