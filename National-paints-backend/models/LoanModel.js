const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
  month: {
    type: Date,
    required: true,
    // unique: true
  },
  installmentPaid:{
    type:Boolean,
    default:false
  },
  amount:{
    type:Number
  },
  empId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Employee'
  }
}, {
  timestamps: true
});

const LoanModel = mongoose.model('Loan', LoanSchema);

module.exports = LoanModel;
