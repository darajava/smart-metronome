
var mongoose = require('mongoose');

module.exports = mongoose.model('User',{
  google: {id: String},
  email: String,
  name: String,
  image: String,
  settings: {
    bpm: Number,
    notesPerBeat: Number,
    octaves: Number,
    scaleSettings: {
      'includeModes': Boolean,
      'useRandomMode': Boolean,
    },
    arpeggioSettings: {
      'includeModes': Boolean,
      'useRandomMode': Boolean,
    },
    exercises: [{type: String}],
  }
});
