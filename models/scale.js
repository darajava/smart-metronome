var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var scaleSchema = new Schema({
  name: String,
  displayName: String
});

var Scale = mongoose.model('Scale', scaleSchema);
module.exports = Scale;
