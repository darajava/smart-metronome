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
    Scale.find({}, function(err, scales) {
      if (!err){ 
        res.render('index', { user: req.user, scales:scales });
      } else {throw err;}
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

  return router;
}
