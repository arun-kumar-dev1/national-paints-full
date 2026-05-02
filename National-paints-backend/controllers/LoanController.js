const asyncHandler = require('express-async-handler');
const EmployeeModel = require('../models/EmployeeModel'); 
const LoanModel = require('../models/LoanModel');
const SalaryModel = require('../models/SalaryModel');

// Controller to give a loan to an employee
const GiveLoan = asyncHandler(async (req, res) => {
  try {
    const { empId, totalAmount, monthlyDeduction, months, amountForMonth, startingMonth } = req.body;

    const employee = await EmployeeModel.findById(empId).populate('salaryArray');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const loanArray = [];
    const startDate = new Date(startingMonth); // Use the startingMonth from the request

    if (amountForMonth) {
      for (let i = 0; i < months; i++) {
        const loanDate = new Date(startDate); // Start from the specified starting month
        loanDate.setMonth(loanDate.getMonth() + i); // Increment month for each entry

        const newLoan = await LoanModel.create({
          month: loanDate,           // Month for which the loan is deducted
          amount: amountForMonth[i],  // Deducted amount for this month
          empId: employee._id,       // Reference to the employee
        });

        loanArray.push(newLoan._id);
      }
    } else {
      for (let i = 0; i < months; i++) {
        const loanDate = new Date(startDate); // Start from the specified starting month
        loanDate.setMonth(loanDate.getMonth() + i); // Increment month for each entry

        const newLoan = await LoanModel.create({
          month: loanDate,           // Month for which the loan is deducted
          amount: monthlyDeduction,  // Deducted amount for this month
          empId: employee._id,       // Reference to the employee
        });

        loanArray.push(newLoan._id);
      }

      const salaryRecord = employee.salaryArray.find((record) => {
        const recordMonth = new Date(record.month);
        return (
          recordMonth.getMonth() === loanDate.getMonth() &&
          recordMonth.getFullYear() === loanDate.getFullYear()
        );
      });

      if (salaryRecord) {
        // If salary record exists, update the loanAmount
        salaryRecord.loanAmount = (salaryRecord.loanAmount || 0) + monthlyDeduction;
        await salaryRecord.save();
      } else {
        console.log("No salary record found for this month.");
      }
    }

    employee.loans.push({
      totalAmount,
      loanArray,
    });

    await employee.save();

    res.status(200).json({
      message: 'Loan given successfully',
      loans: employee.loans,
    });

  } catch (error) {
    res.status(500).json({
      message: 'Failed to give loan to the employee',
      error: error.message,
    });
  }
});

module.exports = {
  GiveLoan,
};
