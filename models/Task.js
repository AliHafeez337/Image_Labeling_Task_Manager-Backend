const mongoose = require('mongoose');
const validator = require('validator');
const _ = require("lodash");

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

const TaskSchema = new mongoose.Schema({
  percent: {
    type: Number,
    required: false,
    default: 0
  },
  name: {
    type: String,
    required: false,
    trim: true,
    unique: true,
    sparse: true
  },
  assignedTo: [{
    type: ObjectId,
    ref: 'User',
    required: false
  }],
  photos: [{
    url: {
      type: String,
      required: true
    }
  }],
  labels: [{
    category: {
      type: String,
      required: false,
      trim: true
    },
    name: {
      type: String,
      trim: true
    },
    done: {
      type: Boolean,
      default: false
    }
  }],
  archived: {
    type: Boolean,
    default: false
  },
  dueDate: {
    type: Date,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

TaskSchema.methods.toJSON = function () {
  var task = this;
  var taskObject = task.toObject();
  var picked = _.pick(taskObject,
    [
      '_id',
      'name',
      'percent',
      'assignedTo',
      'photos',
      'labels',
      'dueDate',
      'archived',
      'createdAt'
    ]);

  return picked;
};

TaskSchema.pre('findOneAndUpdate', async function() {
  // const docToUpdate = await this.model.findOne(this.getQuery());  // The document that `findOneAndUpdate()` will modify
  // console.log(docToUpdate);
  // var percent = 0
  // if(docToUpdate.labels){
  //   var loop = 0
  //   var done = 0
  //   docToUpdate.labels.forEach(label => {
  //     // console.log(label)
  //     loop ++
  //     if (label.done){
  //       done ++
  //     }
  //   });

  //   console.log(percent)
  //   docToUpdate.percent = done / loop * 100
  // }
});

const Task = mongoose.model('Task', TaskSchema);

module.exports = Task;
