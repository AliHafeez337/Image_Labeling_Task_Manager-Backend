const express = require('express');
const router = express.Router();
const passport = require('passport');
const _ = require("lodash");
const fs = require("fs");
const { MongoClient, ObjectId } = require('mongodb');

// Load User model
const Task = require('../models/Task');

// Local imports
const { database, dbName } = require('./../config/db');
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

// Admin can delete a task
router.delete(
  '/delete/:id',
  passport.authenticate('jwt', {session: false}),
  ensureAuthenticated,
  adminAuthenticated,
  async (req, res) => {
    const task = await Task.findByIdAndDelete(req.params.id)

    if (task){
      console.log(task.photos)
      for (let i in task.photos){
        try{
          let $filePath= "./uploads/" + task.photos[i].url
          console.log($filePath)
          fs.unlinkSync($filePath, (err)=>{
              if(err){
                // console.log(err)
                console.log("couldnt delete " + task.photos[i].url + " image");
              }              
          });
        }
        catch(err){
          // console.log(err)
          console.log("couldnt find " + task.photos[i].url + " to be deleted");
        }
      }
      MongoClient.connect(database, async (err, client) => {
        if (err) {
          return console.log('Unable to connect to MongoDB server');
        }
  
        const db = client.db(dbName);
        const collection = 'labels'; 
        
        for (let i in task.labels){
          await db.collection(collection)
          .remove({
            'label': task.labels[i]._id.toString()
          })
          .then(doc => {
            // console.log(doc)
            console.log("Deleted label: " + task.labels[i]._id.toString())
          })
          .catch(err => {
            console.log("Couldn't delete label: " + task.labels[i]._id.toString())
          })
        }
        client.close();
      })

      res.status(200).send(task)
    } else {
      res.status(400).send({
        'errmsg': "Couldn't find any task by this id..."
      })
    }
  }
)

// A labeller can view his/her assigned tasks
router.get(
  '/mine',
  passport.authenticate('jwt', {session: false}),
  ensureAuthenticated,
  async (req, res) => {
    const task = await Task.find(
      { 'assignedTo': req.user._id }
    )

    if (task){
      res.status(200).send(task)
    } else {
      res.status(400).send({
        'errmsg': "Couldn't find any task by this id..."
      })
    }
  }
)

// Any user can view a task
router.get(
  '/:id',
  passport.authenticate('jwt', {session: false}),
  ensureAuthenticated,
  async (req, res) => {
    const task = await Task.findById(req.params.id)

    if (task){
      res.status(200).send(task)
    } else {
      res.status(400).send({
        'errmsg': "Couldn't find any task by this id..."
      })
    }
  }
)

module.exports = router;
