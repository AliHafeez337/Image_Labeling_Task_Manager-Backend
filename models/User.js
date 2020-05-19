const mongoose = require('mongoose');
const validator = require('validator');
const _ = require("lodash");
const jwt = require('jsonwebtoken');

// Local imports
const { JWTsecret } = require('../config/variables');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  usertype: {
    type: String,
    required: true,
    enum: ['admin', 'labeller'],
    default: 'labeller'
  },
  email: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: '{VALUE} is not a valid email'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  tokens: [{
    access: {
      type: String,
      required: true
    },
    token: {
      type: String,
      required: true
    }
  }]
});

UserSchema.methods.toJSON = function () {
  var user = this;
  var userObject = user.toObject();
  var picked = _.pick(userObject,
    [
      'usertype',
      'email',
      'name',
      'createdAt'
    ]);

  return picked;
};

UserSchema.methods.generateAuthToken = function () {
  var user = this;
  var access = 'auth';
  var token = jwt.sign({
      _id: user._id.toHexString(),
      access
    },
    JWTsecret,
    // { expiresIn: '24h' // expires in 24 hours
    // }
  ).toString();
  // console.log(token);
  // user.tokens.concat([{access, token}]);
  user.tokens.push({
    access,
    token
  });

  return user.save().then(() => {
    return token;
  });
};

UserSchema.methods.removeToken = function (token) {
  var user = this;
  return user.update({
    $pull: {
      tokens: {
        token
      }
    }
  });
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
