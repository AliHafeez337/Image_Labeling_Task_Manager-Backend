// this is the config file for multer

const path= require("path");
const multer= require("multer");
const fs = require("fs");

//storage management for the file
//that will be uploaded
let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // console.log(req.originalUrl.slice(1, 10))
    // console.log(path.join(__dirname, '../', 'uploads'))
    if (req.originalUrl.slice(1, 10) === 'taskImage'){
      if (!fs.existsSync(path)) {
        fs.mkdir(path.join(__dirname, '../', 'uploads', req.query.id), (err) => { 
          if (!err) { 
            console.log('Directory: ' + req.query.id + ' created successfully!'); 
          } 
        });
      }
      cb(null, './uploads/' + req.query.id)
    } else {
      cb(null, './uploads/userImages')
    }
  },
  filename: function (req, file, cb) {
    // cb(null, file.originalname)
    if (req.originalUrl.slice(1, 10) === 'taskImage'){
      cb(null, Date.now() + path.extname(file.originalname) + '-' + file.originalname);
    } else {
      cb(null, file.originalname + '-' + Date.now() + path.extname(file.originalname));
    }
  }
})

// File filter for photos...
const fileFilter = (req, file, cb) => {
  // console.log(file)
  if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png'){
      cb(null, true);
  }
  else{
      cb(null, false);
  }
}

 //management of the storage and the file that will be uploaded 
 //.single expects the name of the file input field
const upload = multer({
  storage,
  limits: {
      fileSize: 1024 * 1024 * 5
  },
  fileFilter
}).single("photo");

module.exports = { upload };
