const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const _ = require("lodash");

// Load User model
const User = require('../models/User');
const Task = require('../models/Task');

// Local imports
const { ensureAuthenticated, adminAuthenticated } = require('../auth/auth');


// Admin can create a new task
router.post(
  '/new',
  passport.authenticate('jwt', {session: false}),
  ensureAuthenticated,
  adminAuthenticated, 
  async (req, res) => {
    var newTask = new Task()
    
    newTask
      .save()
      .then(task => {
        res.status(200).send({
          'msg': "New task created successfully!",
          task
        });
      })
      .catch(err => {
        console.log(err)
        res.status(200).send({
          'errmsg': err
        });
      });
  }
)

// Admin can update a task
router.patch(
  '/update',
  passport.authenticate('jwt', {session: false}),
  ensureAuthenticated,
  adminAuthenticated,
  async (req, res) => {
    var body = _.pick(req.body, [
      "name",
      "assignedTo",
      "photos"
    ]);
  }
)

module.exports = router;
