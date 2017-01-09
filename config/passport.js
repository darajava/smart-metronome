// config/passport.js

// load all the things we need
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

// load up the user model
var User = require('../models/user');
var UserLog = require('../models/userlog');
var Scale = require('../models/scale');

// load the auth variables
var configAuth = require('./auth.js');

var seedUserLogs = function(user) {
  Scale.find({}).exec(function(err, scales) {
    var keys = ['a','bb','b','c','db','d','eb','e','f','gb','g','ab'];

    var userLogs = [];
    for (var key = 0; key < keys.length; key++) {
      for (var scale = 0; scale < scales.length; scale++) {
        var userLog = {
          key: keys[key],
          scale: scales[scale].type,
          userId: user._id,
          notesPerBeat: 1,
          octaves: 2,
          bpm: 60,
          adjustedBpm: 15,
          actualBpm: 60,
          time: new Date()
        };

        userLogs.push(userLog);
      }
    }

    UserLog.create(userLogs, function(err) {
      if (err) {
        throw err;
      }
    });
  });
}

module.exports = function(passport) {

  // used to serialize the user for the session
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  // used to deserialize the user
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
  
  // code for login (use('local-login', new LocalStategy))
  // code for signup (use('local-signup', new LocalStategy))
  // code for facebook (use('facebook', new FacebookStrategy))
  // code for twitter (use('twitter', new TwitterStrategy))

  // =========================================================================
  // GOOGLE ==================================================================
  // =========================================================================
  passport.use(new GoogleStrategy({
    clientID    : configAuth.googleAuth.clientID,
    clientSecret  : configAuth.googleAuth.clientSecret,
    callbackURL   : configAuth.googleAuth.callbackURL,
  },
  function(token, refreshToken, profile, done) {

    // make the code asynchronous
    // User.findOne won't fire until we have all our data back from Google
    process.nextTick(function() {

      // try to find the user based on their google id
      User.findOne({ 'google.id' : profile.id }, function(err, user) {
        if (err)
          return done(err);

        if (user) {

          // if a user is found, log them in
          return done(null, user);
        } else {
          // if the user isnt in our database, create a new user
          var newUser      = new User();

          // set all of the relevant information
          newUser.google.id  = profile.id;
          newUser.token = token;
          newUser.name  = profile.displayName;
          newUser.image = profile._json.image.url;
          newUser.email = profile.emails[0].value; // pull the first email

          newUser.settings = {
            bpm: 15,
            notesPerBeat: 1,
            octaves: 2,
            scaleSettings: {
              includeModes: false,
              useRandomMode: false,
            },
            arpeggioSettings: {
              includeModes: false,
              useRandomMode: false,
            },
            exercises: [
              'major-arpeggio',
              'minor-arpeggio',
              'major-scale',
              'minor-scale',
              'chromatic'
            ]
          };

          // save the user
          newUser.save(function(err) {
            if (err)
              throw err;

            seedUserLogs(newUser);
            return done(null, newUser);
          });
        }
      });
    });

  }));

};

