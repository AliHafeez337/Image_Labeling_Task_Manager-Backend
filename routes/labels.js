const express = require('express');
const router = express.Router();
const passport = require('passport');
const _ = require("lodash");
const { MongoClient, ObjectId } = require('mongodb');

// Load User model
// const User = require('../models/User');
const Task = require('../models/Task');

// Local imports
const { database, dbName } = require('./../config/db');
const { ensureAuthenticated, adminAuthenticated } = require('../auth/auth');

// Adding a label
// Not checking if the right labeller is labeling the picture...
router.post(
  '/add/',
  passport.authenticate('jwt', {session: false}),
  ensureAuthenticated,
  async (req, res) => {
    // console.log(req.body)
    MongoClient.connect(database, async (err, client) => {
      if (err) {
        return console.log('Unable to connect to MongoDB server');
      }

      const db = client.db(dbName);
      const collection = 'labels';
      await db.collection(collection)
        .find({
          'label': req.body.label,
          'task': req.body.task,
          'picture': req.body.picture
        })
        .toArray()
        .then(async (docs) => {
          // console.log(docs)
          // console.log(JSON.stringify(docs, undefined, 2));
          if (docs.length > 0){
            await db.collection(collection)
              .remove({
                'label': req.body.label,
                'task': req.body.task,
                'picture': req.body.picture
              })
              .then((doc1) => {
                console.log(doc1.result)
              })
              .catch(err => {
                // console.log(err)
                res.status(400).send({
                  'errmsg': "Unable to delete...",
                  err
                })
              })
          }
          req.body.createdAt = new Date(Date.now())
          await db.collection(collection)
            .save(req.body)
            .then(async doc => {
              console.log(doc.ops)
              if (doc.n === 0){
                res.status(400).send({
                  'errmsg': "Couldn't save the label..."
                })
              }
              var doc1 = await Task.findById(
                { 
                  '_id': req.body.task
                }
              )
              // console.log(doc1)
              for (let i = 0; i < doc1.labels.length; i++){
                if (doc1.labels[i]._id == req.body.label){
                  var doc2 = await Task.findByIdAndUpdate(
                    { 
                      '_id': req.body.task
                    },
                    {
                      $set:
                      {
                        ["labels." + i + ".done"]: true
                      }
                    },
                    { new: true }
                  )
                  // console.log(doc2)
                  res.status(200).send(doc.ops)
                  break
                }
              }
            })
        });
      client.close();
    });
  }
)

// Deleting a label
// Not checking if the right labeller is deleting the label...
router.delete(
  '/delete',
  passport.authenticate('jwt', {session: false}),
  ensureAuthenticated,
  async (req, res) => {
    // console.log(req.query.id)
    MongoClient.connect(database, async (err, client) => {
      if (err) {
        return console.log('Unable to connect to MongoDB server');
      }

      const db = client.db(dbName);
      const collection = 'labels';
      await db.collection(collection)
        .findOne({
          'id': req.query.id
        })
        .then(async label => {
          console.log(label)        
          await db.collection(collection)
            .remove({
              'id': req.query.id
            })
            .then(async doc => {
              console.log(doc)
              var doc1 = await Task.findById(
                { 
                  '_id': label.task
                }
              )
              // console.log(doc1.labels)
              console.log(label.label)
              for (let i = 0; i < doc1.labels.length; i++){
                console.log(doc1.labels[i]._id)
                if (doc1.labels[i]._id == label.label){
                  console.log(i)
                  var doc2 = await Task.findByIdAndUpdate(
                    { 
                      '_id': label.task
                    },
                    {
                      $set:
                      {
                        ["labels." + i + ".done"]: false
                      }
                    },
                    { new: true }
                  )
                  // console.log(doc2)
                  res.status(200).send({
                    'msg': "Successfully deleted the label..."
                  })
                  break
                }
              }
            })
            .catch(err => {
              console.log(err)
              res.status(400).send({
                'errmsg': "Unable to delete...",
              })
            })  
        })
        .catch(err => {
          res.status(400).send({
            'errmsg': "Label doesn't exist, so can't delete...",
          })
        })
      client.close();
    })
  }
)

// Adding a label
// Not checking if the right labeller is labeling the picture...
router.get(
  '/picture/:id',
  passport.authenticate('jwt', {session: false}),
  ensureAuthenticated,
  async (req, res) => {
    MongoClient.connect(database, async (err, client) => {
      if (err) {
        return console.log('Unable to connect to MongoDB server');
      }

      const db = client.db(dbName);
      const collection = 'labels';

      await db.collection(collection)
        .find({
          'picture': req.params.id
        })
        .toArray((err, results) => {
          if (err){
            console.log(err)
            res.status(400).send({
              'errmsg': "Unable to find any labels for this image..."
            })
          };
          // console.log(results)
          res.status(200).send(results)
        })

      client.close();
    })

  }
)

module.exports = router;
