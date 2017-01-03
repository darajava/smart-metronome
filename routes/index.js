var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();
var passport = require('passport');
require('../config/passport.js')(passport)


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

module.exports = function(passport){

  /* GET homepage. */
  router.get('/', isAuthenticated, function(req, res) {
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
        "$or":[
          {'log.userId': "" + req.user._id},
          {'log.userId': {"$exists" : false}}
        ]}
      },
      { $sort: {'log.time':-1}},
      { $group:
        {
          _id: '$name',
          exerciseId: {$first: "$log._id"},
          displayName: {$first: "$displayName"},
          date: {$first: "$log.time"},
          bpm: {$first: "$log.bpm"},
          notesPerBeat: {$first: "$log.notesPerBeat"}}
        },
      { $sort: {'bpm':-1}},
      ],
      function(err, scales) {
        var goodScales = scales.slice(0, scales.length / 2).slice(0, 3);
        var badScales = scales.slice(scales.length / 2).slice(0, 3);
        console.log(scales);
        if (!err)
          res.render('index', { user: req.user, goodScales: scales, badScales, badScales});
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
