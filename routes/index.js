var express = require('express');
var router = express.Router();

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
        {$lookup: {
            from: "userlogs",
            localField: "name",
            foreignField: "scale",
            as: "log"
        }},
          {$match: {"$or":[{'log.userId': {"$exists": false}}, {'log.userId': ""+req.user._id}]}},
          {$unwind: {path: '$log', preserveNullAndEmptyArrays: true}},
          {$sort: {'log.time':-1}},
          {$group: {_id: '$name', displayName: {$first: "$displayName"}, date: {$first: "$log.time"}, notesPerBeat: {$first: "$log.notesPerBeat"}}}
        ],
        function(err, userlog) {
          console.log((userlog));
          if (!err)
            res.render('index', { user: req.user, userlog: userlog});
          else throw err;
    });
  });
  
  router.get('/scalepractice/:scale', isAuthenticated, function(req, res) {
    var Scale = require('../models/scale.js');
    Scale.find({name: req.params.scale}, function(err, scale) {
      console.log(scale);
      if (!err){ 
        res.render('scalepractice', { user: req.user, scale });
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

  /* GET Registration Page */
  router.get('/signup', function(req, res){
    res.render('register',{message: req.flash('message')});
  });

  /* Handle Registration POST */
  router.post('/signup', passport.authenticate('signup', {
    successRedirect: '/',
    failureRedirect: '/signup',
    failureFlash : true  
  }));

  /* Handle Logout */
  router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  router.post('/saveuserlog', function(req, res) {
    try {
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

  return router;
}
