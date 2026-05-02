const asyncHandler = require('express-async-handler');
const EmployeeModel = require('../models/EmployeeModel');
const AttendanceModel = require('../models/AttendanceModel');
const UnPaidEmployeeModel = require('../models/UnPaidEmployeeModel');
const SalaryModel = require('../models/SalaryModel');

const addEmployee = asyncHandler(async (req, res) => {
    try {
        const newEmployee = await UnPaidEmployeeModel.create(req.body);
        res.status(201).json(newEmployee);
    } catch (err) {
        res.status(500).json({ message: 'Failed to add employee', error: err.message });
    }
});

const rejectEmployee = asyncHandler(async (req, res) => {
    try {
        const {id}= req.params
        const rejectedEmployee = await UnPaidEmployeeModel.findByIdAndDelete(id);
        res.status(201).json(rejectedEmployee);
    } catch (err) {
        res.status(500).json({ message: 'Failed to reject employee', error: err.message });
    }
});

const getSingleEmployee = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await EmployeeModel.findById(id)
            .populate('salaryArray')
            .populate('loans.loanArray');

        res.status(201).json(employee);
    } catch (err) {
        res.status(500).json({ message: 'Failed to get employee', error: err.message });
    }
});

const unpaidEmployees = asyncHandler(async (req, res) => {
    try {
        // Add the filter for approvedEmp: true
        const allEmployee = await UnPaidEmployeeModel.find({ approvedEmp: true })
            .populate('attendanceTime');

        res.status(201).json(allEmployee);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch employees', error: err.message });
    }
});

const unapprovedEmployees = asyncHandler(async (req, res) => {
    try {
        const unapprovedEmployee = await UnPaidEmployeeModel.find({ approvedEmp: false })
            .populate('attendanceTime');


        res.status(200).json(unapprovedEmployee);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch unapproved employees', error: err.message });
    }
});

const approveEmployee = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params; // Get employee ID from the request parameters

        // Find the employee by ID and update the approvedEmp field to true
        const employee = await UnPaidEmployeeModel.findByIdAndUpdate(
            id,
            { approvedEmp: true },
            { new: true } // Return the updated employee document
        );

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.status(200).json({
            message: 'Employee approved successfully',
            employee
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to approve employee', error: err.message });
    }
});

const editEmployee = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params; // Get the employee ID from the request parameters

        let employee = await UnPaidEmployeeModel.findByIdAndUpdate(
            id,
            req.body, // Update with all fields provided in the request body
            { new: true, runValidators: true } // Return the updated employee and run validators
        );


        if(!employee){
            employee = await EmployeeModel.findByIdAndUpdate(
                id,
                req.body, // Update with all fields provided in the request body
                { new: true, runValidators: true } // Return the updated employee and run validators
            );
        }
        // If employee is not found
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Return success response
        res.status(200).json({
            message: 'Employee updated successfully',
            employee
        });
    } catch (err) {
        // Catch any error and return a server error response
        res.status(500).json({ message: 'Failed to update employee', error: err.message });
    }
});

const editSalary = asyncHandler(async (req, res) => {
    try {
        const { amount, date, empId } = req.body;
        const employee = await EmployeeModel.findById(empId);

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const newDate = new Date(date);
        const existingEntryIndex = employee.editedSalary.findIndex(entry => {
            const entryDate = new Date(entry.date);
            return entryDate.getFullYear() === newDate.getFullYear() &&
                   entryDate.getMonth() === newDate.getMonth();
        });

        if (existingEntryIndex !== -1) {
            // Update the existing entry
            employee.editedSalary[existingEntryIndex] = {
                date: newDate,
                amount,
                previousSalary: employee.salary || 0
            };
        } else {
            // Add a new entry
            employee.editedSalary.push({
                date: newDate,
                amount,
                previousSalary: employee.salary || 0
            });
        }

        employee.salary = amount;
        await employee.save();

        res.status(200).json({
            message: 'Employee Salary updated successfully',
            employee
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update employee', error: err.message });
    }
});


const transferToPaidEmployee = asyncHandler(async (req, res) => {
    try {
        const {id}  = req.params; // Get the unpaid employee ID from request parameters
        // console.log(req.body)
        // Find the unpaid employee by ID
        const unpaidEmployee = await UnPaidEmployeeModel.findById(id);

        // Check if the unpaid employee exists
        if (!unpaidEmployee) {
            return res.status(404).json({ message: 'Unpaid employee not found' });
        }

        // Create a new employee in EmployeeModel with the details from UnPaidEmployeeModel
        const newEmployee = new EmployeeModel({
            name: unpaidEmployee.name,
            Dob: unpaidEmployee.Dob,
            location: unpaidEmployee.location,
            totalExp: unpaidEmployee.totalExp,
            previousEmployer: unpaidEmployee.previousEmployer,
            bankAccountNumber: unpaidEmployee.bankAccountNumber,
            ifscCode: unpaidEmployee.ifscCode,
            bankBranch: unpaidEmployee.bankBranch,
            mobileNumber: unpaidEmployee.mobileNumber,
            alternateNumber: unpaidEmployee.alternateNumber,
            City: unpaidEmployee.City,
            pinCode: unpaidEmployee.pinCode,
            currentAddress: unpaidEmployee.currentAddress,
            permanentAddress: unpaidEmployee.permanentAddress,
            email: unpaidEmployee.email,
            panNumber: unpaidEmployee.panNumber,
            maritalStatus: unpaidEmployee.maritalStatus,
            bloodGroup: unpaidEmployee.bloodGroup,
            qualification: unpaidEmployee.qualification,
            fathersName: unpaidEmployee.fathersName,
            salary: unpaidEmployee.salary,
            RegisterationDate: unpaidEmployee.RegisterationDate,
            joininDate: unpaidEmployee.joininDate,
            designation: unpaidEmployee.designation,
            empType: unpaidEmployee.empType,
            personId: unpaidEmployee.personId,
            status: unpaidEmployee.status,
            sqlId: unpaidEmployee.sqlId,
            attendanceTime: [],
            employeeCode: unpaidEmployee.employeeCode// Set attendanceTime as empty initially
        });

        // Save the new employee
        await newEmployee.save();

        // Optionally, remove the unpaid employee from the UnPaidEmployeeModel
        await UnPaidEmployeeModel.findByIdAndDelete(id);

        res.status(201).json({
            message: 'Employee successfully transferred to the paid employee list',
            newEmployee
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to transfer employee', error: err.message });
    }
});

const getAllEmployee = asyncHandler(async (req, res) => {
    try {
        const allEmployee = await EmployeeModel.find().populate('attendanceTime').populate('salaryArray').populate('loans.loanArray');

        res.status(201).json(allEmployee);
    } catch (err) {
        res.status(500).json({ message: 'Failed to add employee', error: err.message });
    }
});

const getEmployeeAttendance = async (req, res) => {
    try {
      const { employeeId, month } = req.params;
  
      // Find the employee and populate the attendance records
      const attendanceRecords = await AttendanceModel.find({ empId: employeeId });
  
      // Filter attendance records for the selected month
      const filteredRecords = attendanceRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getFullYear() === new Date(month).getFullYear() && 
               recordDate.getMonth() === new Date(month).getMonth();
      });
  
      res.status(200).json(filteredRecords);
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

  const deleteEmployee = async (req,res) => {
    try{
        const {id} = req.params

        const emp = await EmployeeModel.findById(id)

        emp.delete = true
        emp.status = "Inactive"

        await emp.save()

        res.status(200).json(emp);
    }catch(err) {
        console.error("Error fetching attendance records:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }

  const getAgainEmployee = async (req,res) => {
    try{
        const {id} = req.params

        const emp = await EmployeeModel.findById(id)

        emp.delete = false

        await emp.save()

        res.status(200).json(emp);
    }catch(err) {
        console.error("Error fetching attendance records:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }

  const deletePermanently = async (req,res) => {
    try{
        const {id} = req.params

       const delEmp = await EmployeeModel.findByIdAndDelete(id)

        res.status(200).json(delEmp)
    }catch(err) {
        console.error("Error fetching attendance records:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }

  const deleteSalary = async (req,res) => {
    try{
        const { salaryId, employeeId } = req.params
        
        const delSalary = await SalaryModel.findByIdAndDelete(salaryId)

        const emp = await EmployeeModel.findById(employeeId)

        emp.salaryArray.pull(salaryId)

        await emp.save()

        res.status(200).json(delSalary)
    }catch(err) {
        console.error("Error fetching attendance records:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }

module.exports = {
    addEmployee,
    getAllEmployee,
    getEmployeeAttendance,
    getSingleEmployee,
    unpaidEmployees,
    unapprovedEmployees,
    approveEmployee,
    editEmployee,
    transferToPaidEmployee,
    editSalary,
    deleteEmployee,
    rejectEmployee,
    getAgainEmployee,
    deletePermanently,
    deleteSalary
};