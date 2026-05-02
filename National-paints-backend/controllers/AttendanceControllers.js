
const asyncHandler = require('express-async-handler');
const AttendanceModel = require('../models/AttendanceModel');
const EmployeeModel = require('../models/EmployeeModel');
const moment = require('moment');
const UnPaidEmployeeModel = require('../models/UnPaidEmployeeModel');
// const { zonedTimeToUtc } = require('date-fns-tz');

const extractDate = (dateTime) => {
  if (!dateTime) {
    const now = new Date();
    return now.toISOString().split('T')[0]; // Return the date in YYYY-MM-DD format
  }
  return new Date(dateTime).toISOString().split('T')[0]; 
};

// const checkin = asyncHandler(async (req, res) => {
//   try {
//     const { empId, setTime } = req.body;

//     // Validate `setTime`
//     if (!setTime) {
//       return res.status(400).json({
//         message: 'setTime is required.',
//       });
//     }

//     // Parse the provided time as an IST timestamp
//     let checkinTime = new Date(setTime);
//     if (isNaN(checkinTime.getTime())) {
//       return res.status(400).json({
//         message: 'Invalid date format for setTime.',
//       });
//     }

//     // Convert checkinTime to IST by adding the UTC offset for IST (+5:30)
//     const IST_OFFSET = 6.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
//     checkinTime = new Date(checkinTime.getTime() + IST_OFFSET);

//     // Extract the date part for matching/creating attendance records
//     const checkinDate = extractDate(checkinTime);

//     // Define cutoff time as 10:00 AM in IST
//     const cutoffTime = new Date(checkinDate);
//     cutoffTime.setHours(10, 0, 0, 0); // 10:00 AM IST

//     // Adjust the checkinTime to cutoffTime if it's earlier than 10:00 AM IST
//     if (checkinTime < cutoffTime) {
//       checkinTime = cutoffTime;
//     }

//     // Check if an attendance record already exists for this employee and date
//     let attendance = await AttendanceModel.findOne({
//       empId,
//       date: checkinDate,
//     });

//     if (attendance) {
//       // Add the check-in time to the existing record
//       attendance.timeLogs.push({ checkIn: checkinTime });
//     } else {
//       // Create a new attendance record
//       attendance = new AttendanceModel({
//         empId: empId,
//         date: checkinDate,
//         timeLogs: [{ checkIn: checkinTime }],
//       });
//     }

//     // Save the attendance record
//     const savedAttendance = await attendance.save();

//     // Update the employee's attendance reference in EmployeeModel or UnPaidEmployeeModel
//     const employeeUpdate = await EmployeeModel.findByIdAndUpdate(
//       empId,
//       { $addToSet: { attendanceTime: savedAttendance._id }, check: 1 },
//       { new: true }
//     );

//     if (!employeeUpdate) {
//       const unpaidEmployeeUpdate = await UnPaidEmployeeModel.findByIdAndUpdate(
//         empId,
//         { $addToSet: { attendanceTime: savedAttendance._id }, check: 1 },
//         { new: true }
//       );

//       if (!unpaidEmployeeUpdate) {
//         return res.status(404).json({
//           message: 'Employee not found in both Employee and UnPaidEmployee models',
//         });
//       }
//     }

//     // Respond with success and saved attendance details
//     res.status(200).json({
//       message: 'Check-in successful',
//       attendance: savedAttendance,
//     });
//   } catch (err) {
//     console.error('Error in check-in:', err); // Log error for debugging
//     res.status(500).json({
//       message: 'Failed to check in',
//       error: err.message,
//     });
//   }
// });

// const checkout = asyncHandler(async (req, res) => {
//   try {
//     const { empId, setTime } = req.body;

//     // Validate `setTime`
//     if (!setTime) {
//       return res.status(400).json({
//         message: 'setTime is required.',
//       });
//     }

//     // Parse the provided time as an IST timestamp
//     let checkoutTime = new Date(setTime);
//     if (isNaN(checkoutTime.getTime())) {
//       return res.status(400).json({
//         message: 'Invalid date format for setTime.',
//       });
//     }

//     // Convert checkoutTime to IST by adding the UTC offset for IST (+5:30)
//     const IST_OFFSET = 6.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
//     checkoutTime = new Date(checkoutTime.getTime() + IST_OFFSET);

//     // Extract the date part for matching attendance records
//     const checkoutDate = extractDate(checkoutTime);

//     // Find the attendance record for the employee on the specific date
//     let attendance = await AttendanceModel.findOne({
//       empId,
//       date: checkoutDate,
//     });

//     if (attendance) {
//       const lastLog = attendance.timeLogs[attendance.timeLogs.length - 1];
//       if (lastLog && lastLog.checkIn && !lastLog.checkOut) {
//         // Update the last log with checkout time
//         lastLog.checkOut = checkoutTime;
//       } else {
//         // If no matching check-in exists, create a new time log with checkout only
//         attendance.timeLogs.push({ checkIn: null, checkOut: checkoutTime });
//       }

//       // Calculate total working hours
//       let totalHours = 0;
//       for (const log of attendance.timeLogs) {
//         if (log.checkIn && log.checkOut) {
//           const checkInDate = new Date(log.checkIn);
//           let checkOutDate = new Date(log.checkOut);

//           // Handle the 6:30 PM adjustment logic
//           const sixThirtyPM = new Date(checkInDate);
//           sixThirtyPM.setHours(18, 30, 0, 0); // Set to 6:30 PM

//           const sevenPM = new Date(checkInDate);
//           sevenPM.setHours(19, 0, 0, 0);

//           if (checkOutDate >= sixThirtyPM && checkOutDate < sevenPM) {
//             checkOutDate = sixThirtyPM;
//           }

//           // Calculate the hours worked for the time log
//           totalHours += (checkOutDate - checkInDate) / (1000 * 60 * 60); // Convert ms to hours
//         }
//       }

//       attendance.totalHours = totalHours;
//     } else {
//       // Create a new attendance record if none exists
//       attendance = new AttendanceModel({
//         empId,
//         date: checkoutDate,
//         timeLogs: [{ checkIn: null, checkOut: checkoutTime }],
//         totalHours: 0, // Initialize as 0 since there's no check-in time
//       });
//     }

//     // Save the updated/created attendance record
//     const savedAttendance = await attendance.save();

//     // Update the employee's attendance reference in EmployeeModel or UnPaidEmployeeModel
//     const employeeUpdate = await EmployeeModel.findByIdAndUpdate(
//       empId,
//       { $addToSet: { attendanceTime: savedAttendance._id }, check: 0 },
//       { new: true }
//     );

//     if (!employeeUpdate) {
//       const unpaidEmployeeUpdate = await UnPaidEmployeeModel.findByIdAndUpdate(
//         empId,
//         { $addToSet: { attendanceTime: savedAttendance._id }, check: 0 },
//         { new: true }
//       );

//       if (!unpaidEmployeeUpdate) {
//         return res.status(404).json({
//           message: 'Employee not found in both Employee and UnPaidEmployee models',
//         });
//       }
//     }

//     // Respond with success
//     res.status(200).json({
//       message: 'Check-out successful',
//       attendance: savedAttendance,
//       totalHours: attendance.totalHours, // Send back the total hours
//     });
//   } catch (err) {
//     console.error('Error in checkout:', err); // Log error for debugging
//     res.status(500).json({
//       message: 'Failed to check out',
//       error: err.message,
//     });
//   }
// });


// Check-in Controller
const checkin = asyncHandler(async (req, res) => {
  try {
    const { empId, setTime } = req.body;
    const localOffset = 5.5 * 60 * 60 * 1000
    console.log(setTime)
  
    let checkinTime = new Date(setTime); // Parse the check-in time
    const checkinDate = extractDate(checkinTime); // Extract the date without time
    
    // Define the cutoff time as 10:00 AM
    let cutoffTime = new Date(Date.UTC(checkinTime.getFullYear(), checkinTime.getMonth(), checkinTime.getDate(), 10, 0, 0, 0)); 

    console.log('cutofftime',cutoffTime)

    // cutoffTime = new Date(cutoffTime.getTime()-localOffset);

    console.log("cutoffTimebefore" , cutoffTime)
    console.log("checkinTime" , checkinTime)

    if (checkinTime < cutoffTime) {
      console.log("cutoffTime" , cutoffTime)
      checkinTime = cutoffTime;
    }
    let attendance = await AttendanceModel.findOne({
      empId,
      date: checkinDate
    });

    if (attendance) {
      attendance.timeLogs.push({ checkIn: checkinTime });
    } else {
      attendance = new AttendanceModel({
        empId: empId,
        date: checkinDate,
        timeLogs: [{ checkIn: checkinTime }],
      });
    }

    const savedAttendance = await attendance.save();

    const employeeUpdate = await EmployeeModel.findByIdAndUpdate(
      empId,
      { $addToSet: { attendanceTime: savedAttendance._id }, check: 1 }, 
      { new: true }
    );

    // If employee not found in EmployeeModel, check UnPaidEmployeeModel
    if (!employeeUpdate) {
      const unpaidEmployeeUpdate = await UnPaidEmployeeModel.findByIdAndUpdate(
        empId,
        { $addToSet: { attendanceTime: savedAttendance._id },check: 1 },
        { new: true }
      );

      if (!unpaidEmployeeUpdate) {
        return res.status(404).json({
          message: 'Employee not found in both Employee and UnPaidEmployee models'
        });
      }
    }

    res.status(200).json({
      message: 'Check-in successful',
      attendance: savedAttendance
    });
  } catch (err) {
    res.status(500).json({
      message: 'Failed to check in',
      error: err.message
    });
  }
});

const checkout = asyncHandler(async (req, res) => {
  try {
    const { empId, setTime } = req.body;
    const checkoutTime = new Date(setTime);  // Convert setTime to a Date object
    const checkoutDate = extractDate(checkoutTime);  // Format as YYYY-MM-DD
    console.log(checkoutTime,checkoutDate)
    let attendance = await AttendanceModel.findOne({
      empId,
      date: checkoutDate
    });

    if (attendance) {
      const lastLog = attendance.timeLogs[attendance.timeLogs.length - 1];
      console.log(lastLog)
      if (lastLog && lastLog.checkIn && !lastLog.checkOut) {
        lastLog.checkOut = checkoutTime;
      } else {
        attendance.timeLogs.push({ checkIn: null, checkOut: checkoutTime });
      }

      let totalHours = 0;
      for (const log of attendance.timeLogs) {
        if (log.checkIn && log.checkOut) {
          const checkInDate = new Date(log.checkIn);
          let checkOutDate = new Date(log.checkOut);

          const sixThirtyPM = new Date(checkInDate);
          sixThirtyPM.setHours(18, 30, 0, 0); // Set to 6:30 PM

          const sevenPM = new Date(checkInDate);
          sevenPM.setHours(19, 0, 0, 0);

          console.log(checkOutDate,sixThirtyPM)

          // If last checkout time is between 6:30 PM and 7:00 PM, use 6:30 PM
          if (checkOutDate >= sixThirtyPM && checkOutDate < sevenPM) {
            checkOutDate = sixThirtyPM;
          }
          
          totalHours += (checkOutDate - checkInDate) / (1000 * 60 * 60); // Convert ms to hours
        }
      }

      attendance.totalHours = totalHours;

    } else {
      attendance = new AttendanceModel({
        empId,
        date: checkoutDate,
        timeLogs: [{ checkIn: null, checkOut: checkoutTime }],
        totalHours: 0  // Initialize as 0 (since there's no check-in time)
      });
      console.log('New attendance created without check-in.');
    }

    const savedAttendance = await attendance.save();
    const employeeUpdate = await EmployeeModel.findByIdAndUpdate(
      empId,
      { $addToSet: { attendanceTime: savedAttendance._id }, check: 0 }, 
      { new: true }
    );

    // If employee not found in EmployeeModel, check UnPaidEmployeeModel
    if (!employeeUpdate) {
      const unpaidEmployeeUpdate = await UnPaidEmployeeModel.findByIdAndUpdate(
        empId,
        { $addToSet: { attendanceTime: savedAttendance._id },check: 0 },
        { new: true }
      );

      if (!unpaidEmployeeUpdate) {
        return res.status(404).json({
          message: 'Employee not found in both Employee and UnPaidEmployee models'
        });
      }
    }

    res.status(200).json({
      message: 'Check-out successful',
      attendance: savedAttendance,
      totalHours: attendance.totalHours  // Send back the total hours
    });
  } catch (err) {
    console.error('Error in checkout:', err); // Log error for debugging
    res.status(500).json({
      message: 'Failed to check out',
      error: err.message
    });
  }
});


const guardCheckIn = asyncHandler(async (req, res) => {
  try {
    const { empId, setTime } = req.body;
    const emp = await EmployeeModel.findById(empId)
    if (emp.empType === 'guard') {
      const localOffset = 5.5 * 60 * 60 * 1000
      console.log(setTime)
  
      let checkinTime = new Date(setTime); // Parse the check-in time
      const checkinDate = extractDate(checkinTime); // Extract the date without time
    
      // Define the cutoff time as 10:00 AM
      let cutoffTime = new Date(checkinTime);
      cutoffTime.setHours(9, 0, 0, 0);

      cutoffTime = new Date(cutoffTime.getTime() - localOffset);

      console.log("cutoffTimebefore", cutoffTime)
      console.log("checkinTime", checkinTime)

      if (checkinTime < cutoffTime) {
        console.log("cutoffTime", cutoffTime)
        checkinTime = cutoffTime;
      }
      let attendance = await AttendanceModel.findOne({
        empId,
        date: checkinDate
      });

      if (attendance) {
        attendance.timeLogs.push({ checkIn: checkinTime });
      } else {
        attendance = new AttendanceModel({
          empId: empId,
          date: checkinDate,
          timeLogs: [{ checkIn: checkinTime }],
        });
      }

      const savedAttendance = await attendance.save();

      const employeeUpdate = await EmployeeModel.findByIdAndUpdate(
        empId,
        { $addToSet: { attendanceTime: savedAttendance._id }, check: 1 },
        { new: true }
      );

      // If employee not found in EmployeeModel, check UnPaidEmployeeModel
      if (!employeeUpdate) {
        const unpaidEmployeeUpdate = await UnPaidEmployeeModel.findByIdAndUpdate(
          empId,
          { $addToSet: { attendanceTime: savedAttendance._id }, check: 1 },
          { new: true }
        );

        if (!unpaidEmployeeUpdate) {
          return res.status(404).json({
            message: 'Employee not found in both Employee and UnPaidEmployee models'
          });
        }
      }

      res.status(200).json({
        message: 'Check-in successful',
        attendance: savedAttendance
      });
    } else {
      const localOffset = 5.5 * 60 * 60 * 1000
      console.log(setTime)
  
      let checkinTime = new Date(setTime); // Parse the check-in time
      const checkinDate = extractDate(checkinTime); // Extract the date without time
    
      // Define the cutoff time as 10:00 AM
      // let cutoffTime = new Date(checkinTime);
      // cutoffTime.setHours(9, 0, 0, 0);

      // cutoffTime = new Date(cutoffTime.getTime() - localOffset);
    
    // Define the cutoff time as 9:00 AM
    let cutoffTime = new Date(Date.UTC(checkinTime.getFullYear(), checkinTime.getMonth(), checkinTime.getDate(), 9, 0, 0, 0)); 

    console.log('cutofftime',cutoffTime)


      console.log("cutoffTimebefore", cutoffTime)
      console.log("checkinTime", checkinTime)

      if (checkinTime < cutoffTime) {
        console.log("cutoffTime", cutoffTime)
        checkinTime = cutoffTime;
      }
      let attendance = await AttendanceModel.findOne({
        empId,
        date: checkinDate
      });

      if (attendance) {
        attendance.timeLogs.push({ checkIn: checkinTime });
      } else {
        attendance = new AttendanceModel({
          empId: empId,
          date: checkinDate,
          timeLogs: [{ checkIn: checkinTime }],
        });
      }

      const savedAttendance = await attendance.save();

      const employeeUpdate = await EmployeeModel.findByIdAndUpdate(
        empId,
        { $addToSet: { attendanceTime: savedAttendance._id }, check: 1 },
        { new: true }
      );

      // If employee not found in EmployeeModel, check UnPaidEmployeeModel
      if (!employeeUpdate) {
        const unpaidEmployeeUpdate = await UnPaidEmployeeModel.findByIdAndUpdate(
          empId,
          { $addToSet: { attendanceTime: savedAttendance._id }, check: 1 },
          { new: true }
        );

        if (!unpaidEmployeeUpdate) {
          return res.status(404).json({
            message: 'Employee not found in both Employee and UnPaidEmployee models'
          });
        }
      }

      res.status(200).json({
        message: 'Check-in successful',
        attendance: savedAttendance
      });
    }
  } catch (err) {
    res.status(500).json({
      message: 'Failed to check in',
      error: err.message
    });
  }
});


const todaysPresent = asyncHandler(async (req, res) => {
  try {
    const today = moment().format('YYYY-MM-DD');

    // Find present records in Employee model and UnPaidEmployee model
    const presentEmployeeRecords = await AttendanceModel.find({
      date: today, 
      'timeLogs.checkIn': { $exists: true, $ne: null }
    }).populate({
      path: 'empId',
      model: 'Employee',
    });

    const presentUnpaidEmployeeRecords = await AttendanceModel.find({
      date: today, 
      'timeLogs.checkIn': { $exists: true, $ne: null }
    }).populate({
      path: 'empId',
      model: 'UnPaidEmployee',
    });

    // Filter and map results to get only populated employee data
    const presentEmployees = [
      ...presentEmployeeRecords
        .filter(record => record.empId) // Filter out records without populated empId
        .map(record => ({
          _id: record.empId._id,
          name: record.empId.name,
          salary: record.empId.salary,
          empType: record.empId.empType,
          status: record.empId.status
        })),
      ...presentUnpaidEmployeeRecords
        .filter(record => record.empId) // Filter out records without populated empId
        .map(record => ({
          _id: record.empId._id,
          name: record.empId.name,
          salary: record.empId.salary,
          empType: record.empId.empType,
          status: record.empId.status
        }))
    ];

    res.status(200).json({
      message: "Successfully fetched today's present employees",
      data: presentEmployees
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch today's present employees",
      error: err.message
    });
  }
});




const todaysAbsent = asyncHandler(async (req, res) => {
  try {
    const today = moment().format('YYYY-MM-DD');

    // Get all Employee and UnPaidEmployee records
    const allEmployees = await EmployeeModel.find({});
    const allUnpaidEmployees = await UnPaidEmployeeModel.find({approvedEmp: true});

    // Get all check-ins for today from AttendanceModel
    const todayCheckIns = await AttendanceModel.find({
      date: today,
      'timeLogs.checkIn': { $exists: true, $ne: null }
    });

    // Extract employee IDs who have checked in today
    const checkedInEmployeeIds = todayCheckIns.map(record => record.empId.toString());

    // Filter out employees without a check-in record today
    const absentEmployees = [
      ...allEmployees
        .filter(emp => !checkedInEmployeeIds.includes(emp._id.toString()))
        .map(emp => ({
          _id: emp._id,
          name: emp.name,
          salary: emp.salary,
          empType: emp.empType,
          status: emp.status
        })),
      ...allUnpaidEmployees
        .filter(emp => !checkedInEmployeeIds.includes(emp._id.toString()))
        .map(emp => ({
          _id: emp._id,
          name: emp.name,
          salary: emp.salary,
          empType: emp.empType,
          status: emp.status
        }))
    ];

    res.status(200).json({
      message: "Successfully fetched today's absent employees",
      data: absentEmployees
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch today's absent employees",
      error: err.message
    });
  }
});



const todaysAvailable = asyncHandler(async (req, res) => {
  try {
    const today = moment().format('YYYY-MM-DD');

    // Fetch attendance records for employees in Employee model
    const employeeAttendanceRecords = await AttendanceModel.find({
      date: today,
      'timeLogs.checkIn': { $exists: true, $ne: null }
    }).populate({
      path: 'empId',
      model: 'Employee'
    });

    // Fetch attendance records for employees in UnPaidEmployee model
    const unpaidEmployeeAttendanceRecords = await AttendanceModel.find({
      date: today,
      'timeLogs.checkIn': { $exists: true, $ne: null }
    }).populate({
      path: 'empId',
      model: 'UnPaidEmployee'
    });

    // Filter and map for available employees (check-in but no check-out)
    const availableEmployees = [
      ...employeeAttendanceRecords
        .filter(record => {
          const lastLog = record.timeLogs[record.timeLogs.length - 1];
          return record.empId && lastLog && lastLog.checkIn && !lastLog.checkOut; // Ensure empId exists and check-in without check-out
        })
        .map(record => ({
          _id: record.empId._id,
          name: record.empId.name,
          salary: record.empId.salary,
          empType: record.empId.empType,
          status: record.empId.status
        })),
      ...unpaidEmployeeAttendanceRecords
        .filter(record => {
          const lastLog = record.timeLogs[record.timeLogs.length - 1];
          return record.empId && lastLog && lastLog.checkIn && !lastLog.checkOut; // Ensure empId exists and check-in without check-out
        })
        .map(record => ({
          _id: record.empId._id,
          name: record.empId.name,
          salary: record.empId.salary,
          empType: record.empId.empType,
          status: record.empId.status
        }))
    ];

    res.status(200).json({
      message: "Available employees fetched successfully",
      data: availableEmployees
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch today's available employees",
      error: err.message
    });
  }
});


const todaysLeft = asyncHandler(async (req, res) => {
  try {
    const today = moment().format('YYYY-MM-DD');

    // Fetch attendance records for employees in Employee model
    const employeeAttendanceRecords = await AttendanceModel.find({
      date: today,
      'timeLogs.checkIn': { $exists: true, $ne: null },
      'timeLogs.checkOut': { $exists: true, $ne: null }
    }).populate({
      path: 'empId',
      model: 'Employee'
    });

    // Fetch attendance records for employees in UnPaidEmployee model
    const unpaidEmployeeAttendanceRecords = await AttendanceModel.find({
      date: today,
      'timeLogs.checkIn': { $exists: true, $ne: null },
      'timeLogs.checkOut': { $exists: true, $ne: null }
    }).populate({
      path: 'empId',
      model: 'UnPaidEmployee'
    });

    // Filter and map for employees who have both check-in and check-out
    const leftEmployees = [
      ...employeeAttendanceRecords
        .filter(record => record.empId) // Ensure empId is populated
        .map(record => ({
          _id: record.empId._id,
          name: record.empId.name,
          salary: record.empId.salary,
          empType: record.empId.empType,
          status: record.empId.status
        })),
      ...unpaidEmployeeAttendanceRecords
        .filter(record => record.empId) // Ensure empId is populated
        .map(record => ({
          _id: record.empId._id,
          name: record.empId.name,
          salary: record.empId.salary,
          empType: record.empId.empType,
          status: record.empId.status
        }))
    ];

    res.status(200).json({
      message: "Employees who have checked in and left today fetched successfully",
      data: leftEmployees
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch employees who have checked in and left today",
      error: err.message
    });
  }
});

const editAttendanceTime = async (req, res) => {
  const { empId, date, checkIn, checkOut } = req.body;
  console.log(req.body);
  try {
    // Find the existing attendance record
    let attendanceRecord = await AttendanceModel.findOne({
      empId,
      date,
    });

    // Fetch employee details
    const employee = await EmployeeModel.findById(empId);

    console.log(attendanceRecord);

    // If no attendance record exists, initialize one
    if (!attendanceRecord) {
      attendanceRecord = new AttendanceModel({
        empId,
        date,
        timeLogs: [{}],
      });
    }

    // Helper function to construct a Date without timezone adjustment
    const createUTCDate = (date, time) => {
      const [year, month, day] = date.split('-').map(Number);
      const [hours, minutes] = time.split(':').map(Number);
      return new Date(Date.UTC(year, month - 1, day, hours, minutes));
    };

    // Update check-in time
    if (checkIn) {
      const checkInDateTime = createUTCDate(date, checkIn); // Combine date and time

      // Set the earliest check-in time based on empType
      let earliestCheckIn = new Date(date);
      if (employee.empType === 'officeboy') {
        earliestCheckIn.setUTCHours(9, 0); // Earliest check-in for officeboy
      } else if (employee.empType === 'guard') {
        earliestCheckIn = null; // No restriction for guard
      } else {
        earliestCheckIn.setUTCHours(10, 0); // Earliest check-in for others
      }

      // If an earliest check-in is defined, validate against it
      if (earliestCheckIn && checkInDateTime < earliestCheckIn) {
        attendanceRecord.timeLogs[0].checkIn = earliestCheckIn;
      } else {
        attendanceRecord.timeLogs[0].checkIn = checkInDateTime;
      }

      console.log("checkInDateTime:", checkInDateTime);
      console.log("earliestCheckIn:", earliestCheckIn);
    }

    // Update check-out time
    if (checkOut) {
      const checkOutDateTime = createUTCDate(date, checkOut); // Combine date and time
      attendanceRecord.timeLogs[0].checkOut = checkOutDateTime;

      console.log("checkOutDateTime:", checkOutDateTime);
    }

    // Calculate total hours if both check-in and check-out exist
    const { checkIn: checkInTime, checkOut: checkOutTime } = attendanceRecord.timeLogs[0];

    if (checkInTime && checkOutTime) {
      const totalHours = (checkOutTime - checkInTime) / (1000 * 60 * 60); // Calculate hours in decimal
      console.log("Total Hours:", totalHours);
      attendanceRecord.totalHours = totalHours > 0 ? totalHours : 0;
    }

    // Save the attendance record
    const savedAttendance = await attendanceRecord.save();
    console.log(savedAttendance);

    // Update the employee record with the attendance reference
    const employeeUpdate = await EmployeeModel.findByIdAndUpdate(
      empId,
      { $addToSet: { attendanceTime: savedAttendance._id } },
      { new: true }
    );

    if (!employeeUpdate) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.status(200).json({
      message: 'Attendance record updated successfully',
      attendance: savedAttendance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating attendance record', error: error.message });
  }
};


// const editAttendanceTime = async (req, res) => {
//   const { empId, date, checkIn, checkOut } = req.body;
//   console.log(req.body);
  
//   const localOffset = 5.5 * 60 * 60 * 1000;

//   try {
//     let attendanceRecord = await AttendanceModel.findOne({
//       empId,
//       date
//     });

//     let employee = await EmployeeModel.findById(empId)

//     console.log(attendanceRecord);

//     if (!attendanceRecord) {
//       attendanceRecord = new AttendanceModel({
//         empId,
//         date,
//         timeLogs: [{}]  
//       });
//     }

//     if (checkIn) {
//       const [hours, minutes] = checkIn.split(':'); 
//       const checkInDateTime = new Date(date);
//       checkInDateTime.setUTCHours(hours - 5, minutes - 30); 
//       attendanceRecord.timeLogs[0].checkIn = checkInDateTime;

//       const earliestCheckIn = new Date(date);
//       if(employee.empType == 'officeboy' || employee.empType == 'guard'){
//         earliestCheckIn.setUTCHours(9, 0); 
//       }else{
//         earliestCheckIn.setUTCHours(10, 0); 
//       }
//       const earliestCheckInUTC = new Date(earliestCheckIn.getTime() - localOffset); 

//       if (checkInDateTime < earliestCheckInUTC) {
//         attendanceRecord.timeLogs[0].checkIn = earliestCheckInUTC;
//       }
//     }

//     if (checkOut) {
//       const [hours, minutes] = checkOut.split(':'); 
//       const checkOutDateTime = new Date(date);
//       checkOutDateTime.setUTCHours(hours - 5, minutes - 30); 
//       attendanceRecord.timeLogs[0].checkOut = checkOutDateTime;
//     }

//     const { checkIn: checkInTime, checkOut: checkOutTime } = attendanceRecord.timeLogs[0];
   
//     if (checkInTime && checkOutTime) {
//       const totalHours = (checkOutTime - checkInTime) / (1000 * 60 * 60); 
//       console.log(totalHours)
//       attendanceRecord.totalHours = totalHours > 0 ? totalHours : 0; 

//     }

//     const savedAttendance = await attendanceRecord.save();
//     console.log(savedAttendance);

//     const employeeUpdate = await EmployeeModel.findByIdAndUpdate(
//       empId,
//       { $addToSet: { attendanceTime: savedAttendance._id } },
//       { new: true }
//     );

//     if (!employeeUpdate) {
//       return res.status(404).json({ message: 'Employee not found' });
//     }

//     res.status(200).json({ message: 'Attendance record updated successfully', attendance: savedAttendance });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Error updating attendance record', error: error.message });
//   }
// };

const deleteAttendance = async (req, res) => {
  const { empId, date } = req.params;

  console.log(empId,date)

  try {
    // Find and delete the attendance record for the given employee and date
    const attendanceRecord = await AttendanceModel.findOneAndDelete({
      empId,
      date
    });

    if (!attendanceRecord) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Remove the attendance ID from the employee's attendanceTime array
    const employeeUpdate = await EmployeeModel.findByIdAndUpdate(
      empId,
      { $pull: { attendanceTime: attendanceRecord._id } },
      { new: true }
    );

    if (!employeeUpdate) {
      // If not found in EmployeeModel, check in unPaidEmployee
      const unpaidEmployeeUpdate = await UnPaidEmployeeModel.findByIdAndUpdate(
        empId,
        { $pull: { attendanceTime: attendanceRecord._id } },
        { new: true }
      );

      if (!unpaidEmployeeUpdate) {
        return res.status(404).json({ message: 'Employee not found in either collection' });
      }
    }

    res.status(200).json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting attendance record', error: error.message });
  }
};

const RemoveDay = asyncHandler(async (req, res) => {
  const { empId, date } = req.body;  // Get empId and date from request body
  console.log(date);
  
  try {
    // Find the attendance record for the given employee and date
    let attendanceRecord = await AttendanceModel.findOne({
      empId,
      date
    });

    // If no attendance record is found, create a new attendance record
    if (!attendanceRecord) {
      attendanceRecord = new AttendanceModel({
        empId,
        date,
        removeDay: true,  // Set removeDay to true for the new record
        timeLogs: []      // Initialize timeLogs as an empty array
      });

      // Save the newly created attendance record
      const savedAttendance = await attendanceRecord.save();

      // Update EmployeeModel by adding the new attendance record ID
      const employeeUpdate = await EmployeeModel.findByIdAndUpdate(
        empId,
        { $addToSet: { attendanceTime: savedAttendance._id }, check: 1 }, 
        { new: true }
      );

      // Check if employee exists and was updated
      if (!employeeUpdate) {
        return res.status(404).json({
          message: 'Employee not found or failed to update employee model'
        });
      }

      // Respond with the newly created attendance record
      return res.status(201).json({
        message: 'New attendance record created with removeDay set to true',
        attendance: savedAttendance
      });
    }

    // If attendance record is found, update the removeDay field to true
    attendanceRecord.removeDay = true;

    // Save the updated attendance record
    const updatedAttendance = await attendanceRecord.save();

    // Respond with the updated attendance record
    res.status(200).json({
      message: 'Attendance record updated successfully',
      attendance: updatedAttendance
    });
    
  } catch (err) {
    res.status(500).json({
      message: 'Error updating attendance record',
      error: err.message
    });
  }
});

const RestoreDay = asyncHandler(async (req, res) => {
  const { empId, date } = req.body; // Get empId and date from request body
  console.log(date);

  try {
    // Find the attendance record for the given employee and date
    let attendanceRecord = await AttendanceModel.findOne({
      empId,
      date
    });

    // If no attendance record is found, return an error
    if (!attendanceRecord) {
      attendanceRecord = new AttendanceModel({
        empId,
        date,
        removeDay: false,  // Set removeDay to true for the new record
        timeLogs: []      // Initialize timeLogs as an empty array
      });

      // Save the newly created attendance record
      let savedAttendance = await attendanceRecord.save();

      // Update EmployeeModel by adding the new attendance record ID
      const employeeUpdate = await EmployeeModel.findByIdAndUpdate(
        empId,
        { $addToSet: { attendanceTime: savedAttendance._id }, check: 1 }, 
        { new: true }
      );

      // Check if employee exists and was updated
      if (!employeeUpdate) {
        return res.status(404).json({
          message: 'Employee not found or failed to update employee model'
        });
      }

      // Respond with the newly created attendance record
      return res.status(201).json({
        message: 'New attendance record created with removeDay set to true',
        attendance: savedAttendance
      });
    }

    // Update the removeDay field to false
    attendanceRecord.removeDay = false;

    // Save the updated attendance record
    const updatedAttendance = await attendanceRecord.save();

    // Respond with the updated attendance record
    res.status(200).json({
      message: 'Attendance record updated successfully, removeDay set to false',
      attendance: updatedAttendance
    });
  } catch (err) {
    res.status(500).json({
      message: 'Error updating attendance record',
      error: err.message
    });
  }
});


const RemoveHalfDay = asyncHandler(async (req, res) => {
  const { empId, date } = req.body;  // Get empId and date from request body
  console.log(date);
  
  try {
    // Find the attendance record for the given employee and date
    let attendanceRecord = await AttendanceModel.findOne({
      empId,
      date
    });

    // If no attendance record is found, create a new attendance record
    if (!attendanceRecord) {
      return res.status(400).json({
        message: 'No attendnace recors found ',
        error: err.message
      });
    }

    // If attendance record is found, update the removeDay field to true
    attendanceRecord.removeHalfDay = true;

    // Save the updated attendance record
    const updatedAttendance = await attendanceRecord.save();

    // Respond with the updated attendance record
    res.status(200).json({
      message: 'Attendance record updated successfully',
      attendance: updatedAttendance
    });
    
  } catch (err) {
    res.status(500).json({
      message: 'Error updating attendance record',
      error: err.message
    });
  }
});

const RestoreHalfDay = asyncHandler(async (req, res) => {
  const { empId, date } = req.body;  // Get empId and date from request body
  console.log(date);
  
  try {
    // Find the attendance record for the given employee and date
    let attendanceRecord = await AttendanceModel.findOne({
      empId,
      date
    });

    // If no attendance record is found, create a new attendance record
    if (!attendanceRecord) {
      return res.status(400).json({
        message: 'No attendnace recors found ',
        error: err.message
      });
    }

    // If attendance record is found, update the removeDay field to true
    attendanceRecord.removeHalfDay = false;

    // Save the updated attendance record
    const updatedAttendance = await attendanceRecord.save();

    // Respond with the updated attendance record
    res.status(200).json({
      message: 'Attendance record updated successfully',
      attendance: updatedAttendance
    });
    
  } catch (err) {
    res.status(500).json({
      message: 'Error updating attendance record',
      error: err.message
    });
  }
});



module.exports = { checkin,checkout,todaysPresent,todaysAbsent,todaysAvailable,
  todaysLeft,editAttendanceTime,deleteAttendance,guardCheckIn,RemoveDay,RestoreDay,RemoveHalfDay,RestoreHalfDay };