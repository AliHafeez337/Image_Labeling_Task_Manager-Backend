const express = require('express');
const router = express.Router();
const passport = require('passport');
const _ = require("lodash");
const fs = require("fs");
const { MongoClient, ObjectId } = require('mongodb');

// Load User model
const User = require('../models/User');
const Task = require('../models/Task');

// Local imports
const { database, dbName } = require('./../config/db');
const { ensureAuthenticated, adminAuthenticated } = require('../auth/auth');

// Admin can view his dashboard
router.get(
  '/admin',
  passport.authenticate('jwt', {session: false}),
  ensureAuthenticated,
  adminAuthenticated, 
  async (req, res) => {
    // get all the tasks of the admin
    var tasks = await Task.find()
    
    tasks.forEach(task => {
      var loop = 0
      var done = 0
      task.labels.forEach(label => {
        // console.log(label)
        loop ++
        if (label.done){
          done ++
        }
      })
      // console.log(done / loop * 100)
      task.percent = done / loop * 100
    })
    res.status(200).send(tasks)
  }
)

module.exports = router