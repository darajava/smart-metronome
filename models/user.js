
var mongoose = require('mongoose');

module.exports = mongoose.model('User',{
  id: String,
  email: String,
  name: String,
  image: String
});
