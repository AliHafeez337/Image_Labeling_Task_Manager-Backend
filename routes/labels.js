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

var calculatePercentage = async (labels) => {
  return new Promise(async (resolve, reject) => {
    var loop = 0
    var done = 0
    labels.forEach(label => {
      // console.log(label)
      loop ++
      if (label.done){
        done ++
      }
    })
    resolve(done / loop * 100)
  })
}
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
          req.body.labeller = req.user._id
          await db.collection(collection)
            .save(req.body)
            .then(async doc => {
              // console.log(doc.ops)
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
                  if (doc2){
                    calculatePercentage(doc2.labels)
                      .then(async percent => {
                        var doc3 = await Task.findByIdAndUpdate(
                          { 
                            '_id': doc2._id
                          },
                          {
                            'percent': percent
                          },
                          { new: true }
                        )     
                        res.status(200).send({ 
                          'msg': "Successfully added the label...",
                          labelDetails: doc.ops, 
                          taskDetails: doc3 
                        })  
                      })                  
                  }
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
          // console.log(label)        
          await db.collection(collection)
            .remove({
              'id': req.query.id
            })
            .then(async doc => {
              // console.log(doc)
              var doc1 = await Task.findById(
                { 
                  '_id': label.task
                }
              )

              var deleteThis = true
              for (let j = 0; j < doc1.photos.length; j++){
                if (label.picture === doc1.photos[j]._id.toString()){
                  continue
                }
                await db.collection(collection)
                  .findOne({
                    'picture': doc1.photos[j]._id.toString(),
                    'label': label.label
                  })
                  .then(labels => {
                    // console.log(labels)
                    if (labels){
                      deleteThis = false
                      res.status(200).send({
                        'msg': "This label was deleted but other pictures contain this label...",
                        labels
                      });
                    }
                  })
              }
              // console.log(label.label)
              if (deleteThis){
                for (let i = 0; i < doc1.labels.length; i++){
                  // console.log(doc1.labels[i]._id)
                  if (doc1.labels[i]._id == label.label){
                    // console.log(i)
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
                    if (doc2){
                      // console.log(doc2.labels)
                      calculatePercentage(doc2.labels)
                        .then(async percent => {
                          // console.log(percent)
                          var doc3 = await Task.findByIdAndUpdate(
                            { 
                              '_id': doc2._id
                            },
                            {
                              'percent': percent
                            },
                            { new: true }
                          )     
                          res.status(200).send({ 
                            'msg': "Label was deleted and also the label is undone...",
                            taskDetails: doc3 
                          })  
                        })                  
                    }
                    break
                  }
                } 
              }     
            })
            .catch(err => {
              // console.log(err)
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

// Getting all the labels related to one picture
router.get(
  '/picture/:id',
  // passport.authenticate('jwt', {session: false}),
  // ensureAuthenticated,
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
            // console.log(err)
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


// Getting all the labels done by one labeller on one task
router.get(
  '/labeller/:labellerId/task/:taskId',
  passport.authenticate('jwt', {session: false}),
  ensureAuthenticated,
  adminAuthenticated,
  async (req, res) => {
    MongoClient.connect(database, async (err, client) => {
      if (err) {
        return console.log('Unable to connect to MongoDB server');
      }

      const db = client.db(dbName);
      const collection = 'labels';

      await db.collection(collection)
        .find({
          'labeller': ObjectId(req.params.labellerId),
          'task': req.params.taskId
        })
        .toArray((err, results) => {
          if (err){
            // console.log(err)
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

// Get one label by the _id
router.get(
  '/:id',
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
        .findOne({
          '_id': ObjectId(req.params.id)
        })
        .then(results => {
          // console.log(results)
          res.status(200).send(results)
        })
        .catch(err => {
          // console.log(err)
          res.status(400).send({
            'errmsg': "Unable to find label for this id..."
          })
        })

      client.close();
    })
  }
)

module.exports = router;
