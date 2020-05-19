const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const passportJWT = require("passport-jwt");
const JWTStrategy   = passportJWT.Strategy;
const ExtractJwt = passportJWT.ExtractJwt;

// Local imports
const { JWTsecret } = require('../config/variables');

// Load User model
const User = require('../models/User');

module.exports = function(passport) {

  // Local strategy

  passport.use(
    new LocalStrategy({ 
      usernameField: 'email',
      passwordField: 'password'
    }, async (email, password, done) => {
      // Match user
      var user = await User.findOne({
          email: email
        })

      if (!user) {
        return done(null, false, { message: 'That email is not registered' });
      }

      // Match password
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) throw err;
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'Password incorrect' });
        }
      });
    })
  );

  passport.use(new JWTStrategy({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey   : JWTsecret
  }, async (jwtPayload, cb) => {
      console.log(jwtPayload)
      var user = await User.findById(jwtPayload._id)

      if (!user){
        return cb({
          'errmsg': "No user found."
        });
      }
      else{
        return cb(null, user);
      }
  }
  ));

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
};
