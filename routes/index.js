var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();
var passport = require('passport');
require('../config/passport.js')(passport)

var keys = {
  'a': 'A',
  'bb': 'B♭',
  'b': 'B',
  'c': 'C',
  'db': 'D♭/C♯',
  'd': 'D',
  'eb': 'E♭',
  'e': 'E',
  'f': 'F',
  'gb': 'G♭/F♯',
  'g': 'G',
  'ab': 'A♭',
};

var getRandomKey = function () {
  return Object.keys(keys)[Math.floor(Math.random() * 12)];
}

var isAuthenticated = function (req, res, next) {
  // if user is authenticated in the session,
  // call the next() to call the next request handler 
  // Passport adds this method to request object.
  // A middleware is allowed to add properties to
  // request and response objects
  if (req.isAuthenticated())
    return next();
  // if the user is not authenticated then redirect 
  // him to the login page
  res.redirect('/login');
}

var getScalesWithLogs = function(req, res, key, isScale, runFunction) {
  var Scale = require('../models/scale.js');
  var UserLog = require('../models/userlog.js');

console.log(isScale);
  UserLog.aggregate([
    {$match : {      
      '$and' : [
        {'userId' : req.user._id.toString()},
        {'scale' : {$in : req.user.settings.exercises }},
        {'key' : key}
      ]
    }},
    {
      $lookup : {
        'from': 'scales',
        'localField': 'scale',
        'foreignField': 'type',
        'as': 'scaleData'
      }
    },
    {$unwind : '$scaleData'},
    {$match: {'scaleData.isScale' : isScale}}, 
    {$sort : { 'time' : -1}},
    { $group:
      {
        _id: '$scale',
        exerciseId: {$first: "$_id"},
        date: {$first: "$time"},
        key: {$first: "$key"},
        bpm: {$first: "$bpm"},
        userId: {$first: "$userId"},
        displayName: {$first: "$scaleData.displayName"},
        notesPerBeat: {$first: "$notesPerBeat"},
      }
    }
      
  ], function(err, log) {
    runFunction(err, log);
  });
  
};

module.exports = function(passport){


  /* GET homepage. */
  router.get('/', isAuthenticated, function(req, res) {
    res.render('index', {user: req.user});
  });

  /* GET scales. */
  router.get('/scales', function(req, res) {
    res.render('choosekey', {user: req.user, type: 'scales', keys: keys, random: getRandomKey()});
  });

  router.get('/scales/:key', isAuthenticated, function(req, res) {
    getScalesWithLogs(req, res, req.params.key, true,
      function(err, scales) {
        console.log(scales);
        if (!err)
          res.render('scales', { user: req.user, key: req.params.key, scales: scales, name: "Scales"});
        else throw err;
      });
  });
  
  router.get('/arpeggios', isAuthenticated, function(req, res) {
    res.render('choosekey', {user: req.user, type: 'arpeggios', keys: keys, random: getRandomKey()});
  });
  
  /* GET arpeggios. */
  router.get('/arpeggios/:key', isAuthenticated, function(req, res) {
    getScalesWithLogs(req, res, req.params.key, false,
      function(err, scales) {
        if (!err)
          res.render('scales', { user: req.user, key: req.params.key, scales: scales, name: "Arpeggios", random: getRandomKey()});
        else throw err;
      });
  });
  
  /* GET login page. */
  router.get('/scalepractice/:key/:scale/:exerciseId', isAuthenticated, function(req, res) {
    var UserLog = require('../models/userlog.js');
    UserLog.aggregate([
      {$match: {_id: mongoose.Types.ObjectId(req.params.exerciseId)}},
      {$lookup: {
          from: "scales",
          localField: "scale",
          foreignField: "type",
          as: "scale"
        }
      }
    ], function(err, userlog) {
      console.log(userlog);
      if (!err){ 
        res.render('scalepractice', { user: req.user, userlog: userlog, key: req.params.key });
      } else {throw err;}
    });
  });
  
  /* GET tips page. */
  router.get('/tips', isAuthenticated, function(req, res) {
    res.render('tips', {user: req.user});
  });

  /* GET login page. */
  router.get('/login', function(req, res) {
    res.render('login', { message: req.flash('message') });
  });

  /* GET settings page. */
  router.get('/settings', isAuthenticated, function(req, res) {
    res.render('settings', { user: req.user });
  });

  /* POST settings page. */
  router.post('/settings', isAuthenticated, function(req, res) {
    var User = require('../models/user.js');

    User.findById({_id : req.user._id}, function (err, user) {
      if (err) return res.send(err);
  
      user.settings = req.body.settings;
      user.save(function (err, updatedUser) {
        if (err) res.status(422);
        res.send(updatedUser);
      });
    });
  });


  /* Handle Login POST */
  router.post('/login', passport.authenticate('login', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash : true  
  }));

  /* Handle Logout */
  router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  router.post('/saveuserlog', function(req, res) {
    try {
      console.log(req.body);
      var UserLog = require('../models/userlog.js');
      var log = new UserLog({
        scale: req.body.scale,
        userId: req.user._id,
        notesPerBeat: req.body.notesPerBeat,
        octaves: req.body.octaves,
        bpm: req.body.bpm,
        actualBpm: req.body.actualBpm,
        key: req.body.key
      });
    
      log.save(function(err, userlog){
        if (err) return console.log(err);
        console.log(userlog);
      });
    } catch (err) {
      res.status(500);
      console.log(err);
    }
    res.send('hello');
  });

  router.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

  // the callback after google has authenticated the user
  router.get('/auth/google/callback',
            passport.authenticate('google', {
                    successRedirect : '/',
                    failureRedirect : '/login'
            }));

  return router;
}
