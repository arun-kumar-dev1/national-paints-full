const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  empId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'empModel'  // Dynamically reference based on the 'empModel' field
  },
  empModel: {
    type: String,
    enum: ['UnPaidEmployee', 'Employee']
  },
  date: {
    type: String, 
    required: true
  },
  timeLogs: [
    {
      checkIn: {
        type: Date
      },
      checkOut: {
        type: Date
      },
    }
  ],
  totalHours: {
    type: Number,
    default: 0
  },
  removeDay:{
    type:Boolean,
    default:false
  },
  removeHalfDay:{
    type:Boolean,
    default:false
  },
  totalSalary:{
    type:Number,
    default:0,
  },
  sqlId:String
}, {
  timestamps: true
});

const AttendanceModel = mongoose.model('Attendance', AttendanceSchema);

module.exports = AttendanceModel;
