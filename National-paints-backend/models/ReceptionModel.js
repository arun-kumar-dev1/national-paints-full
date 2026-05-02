const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Reception schema
const receptionSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true, 
  },
  email: {
    type: String,
    unique: true, 
    lowercase: true, 
    match: [/\S+@\S+\.\S+/, 'Please enter a valid email'], 
  },
  password: {
    type: String,
    required: true,
  },
  mobileNumber: {
    type: String,
    match: [/^\d{10}$/, 'Please enter a valid 10-digit mobile number'], 
  },
  role:{
    type:String,
    default:'Reception'
  }
}, {
  timestamps: true, 
});

const ReceptionModel = mongoose.model('Reception', receptionSchema);
module.exports = ReceptionModel;
