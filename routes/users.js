const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
// const jwt = require('jsonwebtoken');
const _ = require("lodash");

// Load User model
const User = require('../models/User');

// Local imports
const { ensureAuthenticated } = require('../auth/auth');
// const { JWTsecret } = require('../config/variables');

// Register
router.post('/register', (req, res) => {

  const { usertype, name, email, password, password2 } = req.body;
  let errors = [];

  if (!name || !email || !password || !password2) {
    errors.push({ msg: 'Please enter all fields' });
  }

  if (password != password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  if (password.length < 6) {
    errors.push({ msg: 'Password must be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.status(400).send({
      'errmsg': errors
    })
  } else {
    User.findOne({ email: email }).then(user => {
      if (user) {
        errors.push({ msg: 'Email already exists' });
        res.status(400).send({
          'errmsg': errors
        })
      } else {
        const newUser = new User({
          usertype,
          name,
          email,
          password
        });

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then(user => {
                req.flash(
                  'success_msg',
                  'You are now registered and can log in'
                );
                res.status(200).send({
                  'msg': "Registered successfully!",
                  user
                });
              })
              .catch(err => console.log(err));
          });
        });
      }
    });
  }
});

// Login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {session: false}, async function(err, user, info){
    if(err){return next(err);}
    if(!user){return res.status(401).send({
      'errmsg': "Failed login attempt"
    })}
    else{
      console.log(user)
      // generate a signed son web token with the contents of user object and return it in the response           
      const token = await user.generateAuthToken();

      return res.status(200).send({
        "msg": "Your are loged in...",
        user, 
        token
      })
    }
  }) (req, res, next);
});

// Logout
router.get(
  '/logout',  
  passport.authenticate('jwt', {session: false}),
  ensureAuthenticated, 
  async (req, res) => {
    try {
      var doc = await req.user.removeToken(req.token);
      if (doc != null) {
        req.flash('success_msg', 'You are logged out');
        res.status(200).send({
          message: "You loged out successfully.",
        });
      } else {
        res.status(401).send({
          errmsg: "Unable to log you out.",
        });
      }
    } catch (e) {
      res.status(400).send({
        errmsg: "Something went wrong in the whole process...",
      });
    }
});

// Profile
router.get(
  '/profile', 
  passport.authenticate('jwt', {session: false}),
  ensureAuthenticated, 
  async (req, res, next) => {
    res.send(req.user);
});

module.exports = router;
