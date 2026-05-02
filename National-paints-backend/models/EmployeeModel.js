const mongoose = require('mongoose');
// const { type } = require('os');

const EmployeeSchema = new mongoose.Schema({
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
  currentSalary:Number,
  editedSalary:[{
    date:Date,
    amount:Number
  }],
  registerationDate:Date,
  joiningDate:Date,
  designation:String,
  approvedEmp:{
    type:Boolean,
    default:false
  },
  delete:{
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
  salaryArray:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Salary'
  }],
  check:{
    type:Number,
    default:0
  },
  personId: { 
    type: Number,
  },
  employeeCode: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'Active'
  },
  sqlId:String,
  loans: [{
    totalAmount: {
      type: Number,
      required: true
    },
    loanArray: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan'
    }]
  }]
  }, {
    timestamps: true
  });

const EmployeeModel = mongoose.model('Employee', EmployeeSchema);

module.exports = EmployeeModel;