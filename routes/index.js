const express = require('express');
const router = express.Router();
const passport = require('passport');

// Local imports
const { ensureAuthenticated } = require('../auth/auth');

// Dashboard
router.get(
  '/dashboard', 
  passport.authenticate('jwt', {session: false}),
  ensureAuthenticated, 
  (req, res) => {
  res.status(200).send({
    'msg': "Your are loged in..."
  });
});

// Welcome Page
router.get('/', (req, res) => res.render('Helo Moto...'));

module.exports = router;
