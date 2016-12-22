var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var userLogSchema = new Schema({
  scale: String,
  userId: String,
  notesPerBeat: Number,
  octaves: Number,
  bpm: Number,
  time: {type: Date, default: Date.now}
});

var UserLog = mongoose.model('UserLog', userLogSchema);
module.exports = UserLog;
