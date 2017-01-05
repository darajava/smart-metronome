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

var getScalesWithLogs = function(req, res, key, scale, runFunction) {
  var Scale = require('../models/scale.js');
  var UserLog = require('../models/userlog.js');
 
 
  Scale.aggregate([
    { $lookup: {
        from: "userlogs",
        localField: "name",
        foreignField: "scale",
        as: "log"
      }
    },
    { $unwind:
      {
        path: '$log', preserveNullAndEmptyArrays: true
      }
    },
    { $match: {
      "$and" : [
        {"$or":[
          {'log.userId': "" + req.user._id},
          {'log.userId': {"$exists" : false}}
        ]},
        {'scale' : scale.toString()},
        {'key' : key}
      ],
      }
    },
    { $sort: {'log.time':-1}},
    { $group:
      {
        _id: '$name',
        exerciseId: {$first: "$log._id"},
        displayName: {$first: "$displayName"},
        date: {$first: "$log.time"},
        bpm: {$first: "$log.bpm"},
        notesPerBeat: {$first: "$log.notesPerBeat"},
        key: {$first: "$key"}
      }
    },
    { $sort: {'bpm':1}},
    { $sort: {'key':1}},
    { $sort: {'scale':1}},
   ], function(err, scales) {runFunction(err, scales)}
    );
  
};

module.exports = function(passport){


  /* GET homepage. */
  router.get('/', isAuthenticated, function(req, res) {
    res.render('index', {user: req.user});
  });

  /* GET scales. */
  router.get('/scales', isAuthenticated, function(req, res) {
    res.render('choosekey', {user: req.user, type: 'scales', keys: keys, random: getRandomKey()});
  });

  router.get('/scales/:key', isAuthenticated, function(req, res) {
    getScalesWithLogs(req, res, req.params.key, true,
      function(err, scales) {
        if (!err)
          res.render('scales', { user: req.user, scales: scales, name: "Scales"});
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
          res.render('scales', { user: req.user, scales: scales, name: "Arpeggios", random: getRandomKey()});
        else throw err;
      });
  });
  
  router.get('/scalepractice/:scale', isAuthenticated, function(req, res) {
    var UserLog = require('../models/userlog.js');
    var log = new UserLog({
      scale: req.params.scale,
      userId: req.user._id,
      notesPerBeat: 1,
      octaves: 2,
      bpm: 15
    });

    log.save(function(err, userlog) {
      if (err) return console.log(err); 
      res.redirect('/scalepractice/' + userlog.scale + '/' + userlog._id);
    });

  });
  
  /* GET login page. */
  router.get('/scalepractice/:scale/:exerciseId', isAuthenticated, function(req, res) {
    var UserLog = require('../models/userlog.js');
    UserLog.aggregate([
      {$match: {_id: mongoose.Types.ObjectId(req.params.exerciseId)}},
      {$lookup: {
          from: "scales",
          localField: "scale",
          foreignField: "name",
          as: "scale"
        }
      }
    ], function(err, userlog) {
      console.log(userlog);
      if (!err){ 
        res.render('scalepractice', { user: req.user, userlog: userlog });
      } else {throw err;}
    });
  });
  
  /* GET login page. */
  router.get('/login', function(req, res) {
    res.render('login', { message: req.flash('message') });
  });

  /* GET login page. */
  router.get('/settings', isAuthenticated, function(req, res) {
    res.render('settings', { user: req.user });
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
        bpm: req.body.bpm
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
