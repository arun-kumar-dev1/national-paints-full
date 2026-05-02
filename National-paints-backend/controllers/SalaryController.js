const asyncHandler = require('express-async-handler');
const SalaryModel = require('../models/SalaryModel'); // Adjust the path as needed
const EmployeeModel = require('../models/EmployeeModel'); // Adjust the path as needed
const LoanModel = require('../models/LoanModel');

const putSalary = asyncHandler(async (req, res) => {
  try {
    const { month, amount, empId,leaveTaken,defaultLeave } = req.body;
    // Find employee by ID
    const employee = await EmployeeModel.findById(empId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const providedMonth = new Date(month).getMonth();
    const providedYear = new Date(month).getFullYear();

    // Check if the salary record already exists for the given month and year
    let existingSalary = await SalaryModel.findOne({
      _id: { $in: employee.salaryArray }, // Check within employee's salaryArray
      $expr: {
        $and: [
          { $eq: [{ $month: "$month" }, providedMonth + 1] }, // +1 because $month returns 1-12
          { $eq: [{ $year: "$month" }, providedYear] },

        ],
      },
    });

    // **New Logic**: Find the loan for this employee and month, if any
    const loansForMonth = await LoanModel.find({
      empId: empId,
      $expr: {
        $and: [
          { $eq: [{ $month: "$month" }, providedMonth + 1] }, // Matching month
          { $eq: [{ $year: "$month" }, providedYear] },       // Matching year
        ],
      },
    });

    // Calculate the total loan amount for the month
    const totalLoanAmount = loansForMonth.reduce((total, loan) => total + loan.amount, 0);

    if (existingSalary) {
      // If salary record exists, update the amount and loan amount
      existingSalary.amount = amount;
      existingSalary.loanAmount = totalLoanAmount; // Deduct loan if present
      existingSalary.isSalaryApproved = true;
      existingSalary.leavesTaken = leaveTaken;
      if(employee.empType != 'staff' && employee.empType != 'sales'){
        existingSalary.leave = 0;
      }
      else if (defaultLeave !== undefined) {
        existingSalary.leave = existingSalary.leave + defaultLeave // Safeguard against undefined
      }
      await existingSalary.save();

      return res.status(200).json({
        message: `Salary for the month of ${providedMonth + 1} updated successfully.`,
        salaryRecord: existingSalary,
      });
    }

    // If no existing salary, create a new record
    const newSalaryRecord = new SalaryModel({
      month, 
      amount,
      loanAmount: totalLoanAmount, // Store loan deduction for the month
      leavesTaken:leaveTaken,
      leave:employee.empType == 'staff' || employee.empType == 'sales' ? defaultLeave !== undefined ? defaultLeave + 1 : 1 : 0,
      isSalaryApproved: true,
    });

    await newSalaryRecord.save();

    // Add new salary record to employee's salary array
    employee.salaryArray.push(newSalaryRecord._id);
    await employee.save();

    res.status(200).json({
      message: `Salary for the month of ${providedMonth + 1} added and linked to employee successfully.`,
      salaryRecord: newSalaryRecord,
      employee,
    });

  } catch (error) {
    console.error("Error in putSalary controller:", error);
    res.status(500).json({
      message: 'Failed to update salary for the month',
      error: error.message,
    });
  }
});

const disapproveSalary = asyncHandler(async (req, res) => {
  try {
    const { month, empId } = req.body;

    // Find employee by ID
    const employee = await EmployeeModel.findById(empId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const providedMonth = new Date(month).getMonth();
    const providedYear = new Date(month).getFullYear();

    // Find the existing salary record for the given month and year
    let existingSalary = await SalaryModel.findOne({
      _id: { $in: employee.salaryArray },
      $expr: {
        $and: [
          { $eq: [{ $month: "$month" }, providedMonth + 1] },
          { $eq: [{ $year: "$month" }, providedYear] },
        ],
      },
    });

    if (!existingSalary) {
      return res.status(404).json({ message: 'Salary record not found for the specified month.' });
    }

    // Update the salary record to disapprove it
    await SalaryModel.findByIdAndUpdate(existingSalary._id,{isSalaryApproved:false});

    return res.status(200).json({
      message: `Salary for the month of ${providedMonth + 1} disapproved successfully.`,
      salaryRecord: [],
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error disapproving salary', error });
  }
});


  const paySalary = asyncHandler(async (req, res) => {
    try {
      const { empId, month, bonus, deduction, leave } = req.body;
      const employee = await EmployeeModel.findById(empId);
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
  
      const providedMonth = new Date(month).getMonth();
      const providedYear = new Date(month).getFullYear();
  
      const salaryRecord = await SalaryModel.findOne({
        _id: { $in: employee.salaryArray },
        $expr: {
          $and: [
            { $eq: [{ $month: "$month" }, providedMonth + 1] }, 
            { $eq: [{ $year: "$month" }, providedYear] },
          ],
        },
      });
  
      if (!salaryRecord) {
        return res.status(404).json({ message: `Salary record for the month of ${providedMonth + 1} not found.` });
      }

      const loanRecord = await LoanModel.findOne({
        empId:empId,
        $expr:{
          $and:[{ $eq: [{ $month: "$month" }, providedMonth + 1] }, { $eq: [{ $year: "$month" }, providedYear] }]
        }
      })

      if(loanRecord){
        loanRecord.installmentPaid = true;
        await loanRecord.save();
      }

      salaryRecord.isPaid = true;
      salaryRecord.bonus = bonus;
      salaryRecord.deduction = deduction;
      salaryRecord.leave = leave;
      await salaryRecord.save();
  
      res.status(200).json({
        message: `Salary for the month of ${providedMonth + 1} marked as paid.`,
        salaryRecord,
      });
    } catch (error) {
      console.error("Error in paySalary controller:", error);
      res.status(500).json({
        message: 'Failed to mark salary as paid',
        error: error.message,
      });
    }
  });

  const unpaySalary = asyncHandler(async (req, res) => {
    try {
      const { empId, month, bonus, deduction } = req.body;
  
      const employee = await EmployeeModel.findById(empId);
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
  
      const providedMonth = new Date(month).getMonth();
      const providedYear = new Date(month).getFullYear();
  
      const salaryRecord = await SalaryModel.findOne({
        _id: { $in: employee.salaryArray },
        $expr: {
          $and: [
            { $eq: [{ $month: "$month" }, providedMonth + 1] }, 
            { $eq: [{ $year: "$month" }, providedYear] },
          ],
        },
      });
  
      if (!salaryRecord) {
        return res.status(404).json({ message: `Salary record for the month of ${providedMonth + 1} not found.` });
      }

      salaryRecord.isPaid = false;
      salaryRecord.bonus = 0;
      salaryRecord.deduction = 0;
      await salaryRecord.save();
  
      res.status(200).json({
        message: `Salary for the month of ${providedMonth + 1} marked as unpaid.`,
        salaryRecord,
      });
    } catch (error) {
      console.error("Error in paySalary controller:", error);
      res.status(500).json({
        message: 'Failed to mark salary as unpaid',
        error: error.message,
      });
    }
  });

  const payAdvance = asyncHandler(async (req, res) => {
    try {
      const { empId, month } = req.body;
      console.log(month)
      // Find the employee
      const employee = await EmployeeModel.findById(empId);
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
  
      const providedMonth = new Date(month).getMonth();
      const providedYear = new Date(month).getFullYear();
      // console.log(providedMonth)
      // Find the salary record for the specified month
      let salaryRecord = await SalaryModel.findOne({
        _id: { $in: employee.salaryArray },
        $expr: {
          $and: [
            { $eq: [{ $month: "$month" }, providedMonth +1] },
            { $eq: [{ $year: "$month" }, providedYear] },
          ],
        },
      });
  
      if (!salaryRecord) {
        salaryRecord = new SalaryModel({
          month : month,      // Storing the whole date object
          amount: 0,  // Defaulting amount to zero
          advance: true, // Marking advance as true for the new record
        });
  
        await salaryRecord.save();
  
        // Add the new salary record to the employee's salary array
        employee.salaryArray.push(salaryRecord._id);
        await employee.save();
  
        return res.status(200).json({
          message: `New salary record created and advance for the month of ${providedMonth + 1} marked as paid.`,
          salaryRecord,
          employee,
        });
      }
  
      // If salary record exists, update it by setting advance to true
      salaryRecord.advance = true;
      await salaryRecord.save();
  
      res.status(200).json({
        message: `Advance for the month of ${providedMonth + 1} marked as paid.`,
        salaryRecord,
      });
  
    } catch (error) {
      console.error("Error in payAdvance controller:", error);
      res.status(500).json({
        message: 'Failed to mark advance as paid',
        error: error.message,
      });
    }
  });

  const unpayAdvance = asyncHandler(async (req, res) => {
    try {
      const { empId, month } = req.body;
  
      // Find the employee
      const employee = await EmployeeModel.findById(empId);
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
  
      const providedMonth = new Date(month).getMonth();
      const providedYear = new Date(month).getFullYear();
  
      // Find the salary record for the specified month
      const salaryRecord = await SalaryModel.findOne({
        _id: { $in: employee.salaryArray },
        $expr: {
          $and: [
            { $eq: [{ $month: "$month" }, providedMonth + 1] },
            { $eq: [{ $year: "$month" }, providedYear] },
          ],
        },
      });
  
      if (!salaryRecord) {
        return res.status(404).json({
          message: `No salary record found for the month ${providedMonth + 1} of ${providedYear}.`,
        });
      }
  
      // If the salary record exists, update the `advance` field to `false`
      salaryRecord.advance = false;
      await salaryRecord.save();
  
      res.status(200).json({
        message: `Advance for the month of ${providedMonth + 1} has been marked as unpaid.`,
        salaryRecord,
      });
    } catch (error) {
      console.error("Error in unpayAdvance controller:", error);
      res.status(500).json({
        message: 'Failed to mark advance as unpaid',
        error: error.message,
      });
    }
  });
  
  

  const generateSalarySlip = asyncHandler(async (req, res) => {
    try {
        // Destructure `month` (as a Date object) and `empId` from the request body
        const { month, empId } = req.body;

        // Extract the year and month from the provided date object
        const providedMonth = new Date(month).getMonth(); // 0-11
        const providedYear = new Date(month).getFullYear();

        // Find the employee by empId and populate the salaryArray
        const employee = await EmployeeModel.findById(empId).populate('salaryArray');

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Find the salary for the specified month and year in the salaryArray
        const salaryForMonth = employee.salaryArray.find(salary => {
            const salaryMonth = new Date(salary.month).getMonth(); // Assuming salary.date is a Date object
            const salaryYear = new Date(salary.month).getFullYear();
            
            return salaryMonth === providedMonth && salaryYear === providedYear;
        });

        if (!salaryForMonth) {
            return res.status(404).json({ message: `Salary data not found for the month: ${providedMonth + 1} and year: ${providedYear}` });
        }

        // Send the employee data along with the salary for the specified month
        res.status(200).json({
            employeeDetails: employee,
            salaryDetails: salaryForMonth
        });
    } catch (err) {
        // Handle any errors
        res.status(500).json({ message: 'Failed to get employee or salary data', error: err.message });
    }
});
  
module.exports = {
  putSalary,
  paySalary,
  generateSalarySlip,
  payAdvance,
  disapproveSalary,
  unpayAdvance,
  unpaySalary
};
