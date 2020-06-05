const express = require('express');
const router = express.Router();
const passport = require('passport');
const _ = require('lodash');
const multer = require('multer');
const fs = require("fs");

// Load User model
const User = require('../models/User');
const Task = require('../models/Task');
const { upload } = require("../config/multer");

// Local imports
const { ensureAuthenticated, adminAuthenticated } = require('../auth/auth');

// Edit a user...
// Admin can edit someone witout password, All can edit themselves fully except their email...
router.patch(
  '/add', 
  passport.authenticate('jwt', {session: false}),
  ensureAuthenticated,
  adminAuthenticated,
  (req, res) => {
    // try {
      const id = req.query.id;
      // console.log(id)
      upload(req, res, async function (err) {
        if(req.file == null || req.file == undefined || req.file == ""){
          // res.json('No Image Set');
          res.status(200).send({
            errmsg: "Please, select an image of less than 5Mbs."
          })
        } else {
          if (err) {
            console.log(err);
          } else {
            console.log(req.file.filename)
            var doc = await Task.findByIdAndUpdate(
                { _id: id }, 
                { 
                  $push: { 
                    photos: { 
                      url: req.query.id + '/' + req.file.filename,
                      labels: []
                    }
                  }
                },
                { new: true }
                );
            // console.log(doc);
            if (doc == null){
                res.status(400).send({
                    errmsg: "Document to be updated not found."
                })
            }
            else{
                res.status(200).send(doc);
            }    
          }
        }
      });
    // }
    // catch(e){
    //   res.status(400).send({
    //     errmsg: e
    //   })
    // }
  }
)

// User can delete his photo
router.patch(
  '/delete', 
  passport.authenticate('jwt', {session: false}),
  ensureAuthenticated,
  adminAuthenticated,
  async (req, res) => {
    // console.log(req.query.photoUrl)
    var doc = await Task.findByIdAndUpdate(
      { _id:  req.query.id }, 
      { 
        $pull: { 
          photos: {
            url: req.query.photoUrl
          }
        }
      },
      { new: true }
      );
    // console.log(doc);
      
    try{
        let $filePath= "./uploads/" + req.query.photoUrl
        console.log($filePath)
        fs.unlinkSync($filePath, (err)=>{
            if(err){
                console.log("couldnt delete " + req.query.photo + " image");
                res.status(400).send({
                    "errmsg": "Sorry, couldnt delete image..."
                })
            }              
        });
    }
    catch(e){
        console.log("couldnt find " + req.query.photo + " to be deleted");
    }
    res.status(200).send({
        "msg": "The image is deleted...",
        doc
    })
  }
)

module.exports = router;
