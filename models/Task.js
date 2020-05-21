const mongoose = require('mongoose');
const validator = require('validator');
const _ = require("lodash");

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

const TaskSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
    trim: true
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
      'assignedTo',
      'photos',
      'labels',
      'dueDate',
      'archived',
      'createdAt'
    ]);

  return picked;
};

const Task = mongoose.model('Task', TaskSchema);

module.exports = Task;
