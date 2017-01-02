var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var scaleSchema = new Schema({
  key: String,
  displayName: String,
  type: String
});

var Scale = mongoose.model('Scale', scaleSchema);
module.exports = Scale;
