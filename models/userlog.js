var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var userLogSchema = new Schema({
  scale: String,
  key: String,
  userId: String,
  notesPerBeat: Number,
  octaves: Number,
  bpm: Number,
  actualBpm: Number,
  time: {type: Date, default: Date.now},
  nextId: {type: String, default: null}
});

var UserLog = mongoose.model('UserLog', userLogSchema);
module.exports = UserLog;
