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
          'errmsg': "Couldn't create a new task...",
          err
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
    const id = req.query.id
    var body = _.pick(req.body, [
      "name",
      "assignedTo",
      "archived",
      "labels",
      "dueDate"
    ])
    // console.log(body)
    
    // if labels are being edited, just remove all labels
    if (body.labels){
      await Task.findByIdAndUpdate(
        { _id: req.query.id },
        { $set: {
            'labels': []
          } 
        },
        { new: true }
      ).exec(function(err){
        if (err){
          res.status(400).send({
            'errmsg': "Couldn't empty the old labels.",
            err
          })
        }
      });
    }

    // if labellers are being edited, just remove all labellers
    if (body.assignedTo){
      await Task.findByIdAndUpdate(
        { _id: req.query.id },
        { $set: {
            'assignedTo': []
          } 
        },
        { new: true }
      ).exec(function(err){
        if (err){
          res.status(400).send({
            'errmsg': "Couldn't empty the old assignedTos.",
            err
          })
        }
      });
    }

    // Now write it as new...
    Task.findByIdAndUpdate(
      { _id: req.query.id },
      body,
      { new: true }
    ).exec(function(err, doc){
      if (err){
        console.log(err)
        res.status(400).send({
          'errmsg': "Couldn't update the task...",
          err
        })
      } else {
        res.status(200).send(doc)
      }
    })
  }
)

module.exports = router;
