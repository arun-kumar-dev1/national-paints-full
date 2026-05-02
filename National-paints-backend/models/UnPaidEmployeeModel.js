const mongoose = require('mongoose');
// const { type } = require('os');

const UnPaidEmployeeSchema = new mongoose.Schema({
  name:String,
  Dob:Date,
  location:String,
  totalExp:Number,
  previousEmployer:String,
  bankAccountNumber:Number,
  ifscCode:String,
  bankBranch:String,
  mobileNumber:Number,
  alternateNumber:Number,
  City:String,
  pinCode:String,
  currentAddress:String,
  permanentAddress:String,
  email:String,
  panNumber:String,
  maritalStatus:String,
  bloodGroup:String,
  qualification:String,
  fathersName:String,
  salary:Number,
  registerationDate:Date,
  joiningDate:Date,
  designation:String,
  approvedEmp:{
    type:Boolean,
    default:false
  },
  empType:{
    type:String,
    enum:['staff','labour','sales','officeboy','guard']
  },
  attendanceTime:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Attendance'
  }],
  check:{
    type:Number,
    default:0
  },
  personId: { 
    type: Number,
  },
  status: {
    type: String,
    default: 'Active'
  },
  employeeCode: {
    type: String,
    default: ''
  },
  sqlId:String
  }, {
    timestamps: true
  });

const UnPaidEmployee = mongoose.model('UnPaidEmployee', UnPaidEmployeeSchema);

module.exports = UnPaidEmployee;