const mongoose = require('mongoose');

const HolidaySchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
  },
  name:{
    type:String
  },
  isPaid: {
    type: Boolean,
    default: true 
  }
}, {
  timestamps: true
});

const HolidayModel = mongoose.model('Holiday', HolidaySchema);

module.exports = HolidayModel;
