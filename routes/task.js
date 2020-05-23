const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const _ = require("lodash");
const { MongoClient, ObjectId } = require('mongodb');

// Load User model
const User = require('../models/User');
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

// var findLabels = async (db, collection, photos) => {
//   return new Promise(async (resolve, reject) => {
//     var result = []
//     for (let i in photos){
//       var photo = {}
//       photo._id = photos[i]._id
//       photo.url = photos[i].url

//       var result = await db.collection(collection)
//         .find({
//           'picture': photos[i]._id.toString()
//         })
//         .toArray((err, results) => {
//           if (err){
//             console.log(err)
//           };
//           // console.log(results)

//           photo.labels = results
//           // console.log(photo)
//           result.push(photo)
//           // console.log(result)
//         })
//     }
//     resolve(result)
//   })
// }

// Any user can view a task
router.get(
  '/view/:id',
  passport.authenticate('jwt', {session: false}),
  ensureAuthenticated,
  async (req, res) => {
    const task = await Task.findById(req.params.id)

    if (task){
      res.status(200).send(task)

      // MongoClient.connect(database, async (err, client) => {
      //   if (err) {
      //     return console.log('Unable to connect to MongoDB server');
      //   }
  
      //   const db = client.db(dbName);
      //   const collection = 'labels';

      //   findLabels(db, collection, task.photos)
      //     .then(photos => {
      //       // console.log(photos)
      //       clonedTask.photos = photos
      //       // console.log(clonedTask.photos)
      //       res.status(200).send(clonedTask)
      //     })
      //     .catch(err => {
      //       console.log(err)
      //     })
      //   // for (let i in task.photos){
      //   //   var photo = {}
      //   //   photo._id = task.photos[i]._id
      //   //   photo.url = task.photos[i].url

      //   //   await db.collection(collection)
      //   //     .find({
      //   //       'picture': task.photos[i]._id.toString()
      //   //     })
      //   //     .toArray((err, results) => {
      //   //       if (err){
      //   //         console.log(err)
      //   //       };
      //   //       // console.log(results)

      //   //       photo.labels = results
      //   //       console.log(photo)
      //   //       clonedTask.photos.push(photo)
      //   //     })
      //   // }
      //   console.log(clonedTask.photos)
      //   res.status(200).send(clonedTask)
      //   client.close();
      // })
    } else {
      res.status(400).send({
        'errmsg': "Couldn't find any task by this id..."
      })
    }
  }
)

module.exports = router;
