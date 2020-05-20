const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
// const jwt = require('jsonwebtoken');
const _ = require("lodash");

// Load User model
const User = require('../models/User');

// Local imports
const { ensureAuthenticated, adminAuthenticated } = require('../auth/auth');
// const { JWTsecret } = require('../config/variables');

// A hash generator promise for password...
var genHash = async (password) => {
  return new Promise(async (resolve, reject) => {
    try {
      bcrypt.genSalt(9, (err, salt) => {
        bcrypt.hash(password, salt, (err, hash) => {
          resolve(hash);
        });
      });
    } catch (e) {
      reject();
    }
  });
};

// Admin can create a new user
router.post(
  '/create',
  passport.authenticate('jwt', {session: false}),
  ensureAuthenticated,
  adminAuthenticated, 
  async (req, res) => {
    var body = _.pick(req.body, [
      "name",
      "usertype",
      "email",
      "archived",
      "password",
      "password2"
    ]);
    console.log(body)

    if (body.password != null && body.password2 != null){
      if (body.password !== body.password2){
        res.status(400).send({
          'errmsg': "Passwords must match..."
        })
      }
      else{
        genHash(body.password)
          .then(async (hash) => {
            body.password = hash;
            
            var newUser = new User(body)
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
              .catch(err => {
                console.log(err)
                res.status(200).send({
                  'errmsg': err
                });
              });
          })
          .catch((e) => {
            console.log(e);
            res.status(400).send({
              errmsg: "Couldn't generate the hash.",
            });
          });
      }
    }
    res.status(400).send({
      errmsg: "Please provide complete data.",
    });
  }
)

// Admin can update a user
router.patch(
  '/update/:id',
  passport.authenticate('jwt', {session: false}),
  ensureAuthenticated,
  adminAuthenticated, 
  async (req, res) => {
    const id = req.params.id;
    var body = _.pick(req.body, [
      "name",
      "usertype",
      "email",
      "archived",
      "password",
      "password2"
    ]);

    if (!id.match(/^[0-9a-fA-F]{24}$/)){ // if object id is not valid
      res.status(400).send({
        'errmsg': "Valid Id must be provided..."
      })
    }
    else{
      if (body.password != null && body.password2 != null){
        if (body.password !== body.password2){
          res.status(400).send({
            'errmsg': "Passwords must match..."
          })
        }
        else{
          genHash(body.password)
            .then(async (hash) => {
              body.password = hash;
              
              var doc = await User.findByIdAndUpdate(
                { _id: id },
                body,
                { new: true });
              res.status(200).send({
                'msg': "Updated successfully!",
                doc
              })
            })
            .catch((e) => {
              console.log(e);
              res.status(400).send({
                errmsg: "Couldn't generate the hash.",
              });
            });
        }
      }
      else{
        var doc = await User.findByIdAndUpdate(
          { _id: id },
          body,
          { new: true });
        res.status(200).send({
          'msg': "Updated successfully!",
          doc
        })
      }
    }
  }
)

// Admin can delete a user
router.delete(
  '/delete/:id',
  passport.authenticate('jwt', {session: false}),
  ensureAuthenticated,
  adminAuthenticated, 
  async (req, res) => {
    const id = req.params.id;
    var doc = await User.deleteOne({ _id: id });
    console.log(doc);
    if (doc.deletedCount == 0){
      res.status(400).send({
        'errmsg': "Sorry, unable delete user."
      })
    } else {
      res.status(200).send({
        'msg': "User deleted successfully!"
      }) 
    }
  }
)

module.exports = router;
