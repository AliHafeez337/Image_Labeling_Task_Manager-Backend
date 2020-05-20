const express = require('express');
const bodyParser = require("body-parser");
const path = require("path");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
const http = require("http");

const PORT = process.env.PORT || 3000;

/* SERVER SETUP */

var app = express();
var server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}.`);
});


/* LOCAL IMPORTS */

const { secret } = require('./config/variables');

// pasport config
require('./auth/passport')(passport);

/* DATABASE */

// DB Config
const { mongoURI } = require('./config/db');

// Connect to MongoDB
mongoose
  .connect(
    mongoURI,
    {
        useNewUrlParser: true, 
        useUnifiedTopology: true, 
        useCreateIndex: true,  
        useFindAndModify: false,
        useUnifiedTopology: true
    }
  )
  .then(() => console.log('MongoDB is Connected.'))
  .catch(err => console.log(err));

/* APP SETUP */

// Express body parser
app.use(express.urlencoded({ extended: true }));

// CORS setup
app.use((req, res, next) => {
    // console.log(req);
    res.setHeader("Access-Control-Allow-Origin", "*");
    // res.setHeader("Access-Control-Allow-Headers", "*");
    // res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, x-auth"
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PATCH, PUT, DELETE, OPTIONS"
    );
    next();
});

// Other setups
app.use(logger("dev"));
app.use(express.json());
app.use(
    express.urlencoded({
        extended: false,
    })
);
app.use(
    bodyParser.urlencoded({
        extended: false,
    })
);
app.use(cookieParser());
    
// Express session
app.use(
  session({
    secret,
    resave: true,
    saveUninitialized: true
  })
);

// Passport middleware
app.use(passport.initialize());
// app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

/* ROUTES */

app.use('/admin', require('./routes/admin'));
app.use('/user', require('./routes/users'));
app.use('/', require('./routes/index'));