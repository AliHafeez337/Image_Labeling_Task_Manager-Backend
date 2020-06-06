const express = require('express');
const router = express.Router();
const passport = require('passport');
const _ = require('lodash');
const multer = require('multer');
const fs = require("fs");

// Load User model
const User = require('../models/User');
const { upload } = require("../config/multer");

// Local imports
const { ensureAuthenticated } = require('../auth/auth');

// Edit a user...
// Admin can edit someone witout password, All can edit themselves fully except their email...
router.patch(
  '/add', 
  passport.authenticate('jwt', {session: false}),
  ensureAuthenticated,
  (req, res) => {
    try {
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
            
            if (req.user.photo != null  || req.user.photo != ''){
              var doc = await User.findByIdAndUpdate(
                { _id:  req.user._id }, 
                { photo: '' }
                );
              // console.log(doc);
              try{
                let $filePath= "./uploads/" + doc.photo
                fs.unlinkSync($filePath, (err)=>{
                    if(err){
                        console.log("couldnt delete " + doc.photo + " image");
                    }              
                });
              }
              catch(e){
                console.log("couldnt find " + doc.photo + " to be deleted");
              }
            }
            var doc = await User.findByIdAndUpdate(
                { _id: req.user._id }, 
                { photo: req.file.filename }, 
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
    }
    catch(e){
      console.log(e)
      res.status(400).send({
        errmsg: e
      })
    }
  }
)

// User can delete his photo
router.patch(
  '/delete', 
  passport.authenticate('jwt', {session: false}),
  ensureAuthenticated,
  async (req, res) => {
    var doc = await User.findByIdAndUpdate(
      {_id:  req.user._id}, 
      {photo: ''}
      );
      
    try{
        let $filePath= "./uploads/userImages/" + req.user.photo
        console.log($filePath)
        fs.unlinkSync($filePath, (err)=>{
            if(err){
                console.log("couldnt delete " + req.user.photo + " image");
                res.status(400).send({
                    "errmsg": "Sorry, couldnt delete image..."
                })
            }              
        });
    }
    catch(e){
        console.log("couldnt find " + req.user.photo + " to be deleted");
    }
    res.status(200).send({
        "msg": "The image is deleted..."
    })
  }
)

module.exports = router;
