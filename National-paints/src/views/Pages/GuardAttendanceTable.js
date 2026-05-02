import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Text,
  Button,
  HStack,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { allEmployee } from "features/Employee/EmployeeSlice";
import { allHoliday } from "features/Holiday/HolidaySlice";
import { putSalary, pullSalary } from "features/Employee/EmployeeSlice";
import { CSVLink } from "react-csv";
import { FaDownload } from "react-icons/fa";
import { removeDay } from "features/Attendance/AttendanceSlice";
import { restoreDay } from "features/Attendance/AttendanceSlice";
import { RxCrossCircled } from "react-icons/rx";
import { TiTick } from "react-icons/ti";

const GuardAttendanceTable = () => {
  const dispatch = useDispatch();

  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [daysInMonth, setDaysInMonth] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");
  const allHolidays = useSelector((state) => state.holiday.allHolidays);
  const [holidaysInMonth, setHolidaysInMonth] = useState([]);

  const allEmployees = useSelector((state) => state.employee?.allEmployees);
  const employees = allEmployees?.filter(
    (employee) => employee.empType === "guard" && !employee.delete
  );
  const { monthSalary } = useSelector((state) => state.employee);
  const { removedDay, restoredDay } = useSelector((state) => state.attendance);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  useEffect(() => {
    dispatch(allEmployee());
    dispatch(allHoliday());
  }, [dispatch, monthSalary, removedDay, restoredDay]);

  useEffect(() => {
    const days = Array.from(
      { length: new Date(year, month + 1, 0).getDate() },
      (_, i) => i + 1
    );
    setDaysInMonth(days);
  }, [year, month]);

  useEffect(() => {
    const holidays = getHolidaysForMonth(month, year);
    setHolidaysInMonth(holidays);
  }, [month, year, allHolidays]);

  // Check if a specific day has passed
  const isPastDay = (day) => {
    if (year < currentYear) return true;
    if (year === currentYear && month < currentMonth) return true;
    if (year === currentYear && month === currentMonth && day <= currentDay) return true;
    return false;
  };

  const getHolidaysForMonth = (month) => {
    return allHolidays?.filter((holiday) => {
      const holidayDate = new Date(holiday.date);
      return (
        holidayDate.getMonth() === month &&
        holidayDate.getFullYear() === year
      );
    });
  };

  const isHoliday = (day) => {
    return holidaysInMonth?.some((holiday) => {
      const holidayDate = new Date(holiday.date);
      return holidayDate.getDate() === day;
    });
  };

  const isSunday = (date) => {
    return new Date(year, month, date).getDay() === 0;
  };

  const getHolidayNameByDate = (day) => {
    const holiday = holidaysInMonth?.find((holiday) => {
      const holidayDate = new Date(holiday.date);
      return (
        holidayDate.getDate() === day &&
        holidayDate.getMonth() === month &&
        holidayDate.getFullYear() === year
      );
    });

    return holiday ? holiday.name : "N/A";
  };

  const roundMinutes = (minutes) => {
    if (minutes <= 10) return 0;
    if (minutes <= 25) return 15;
    if (minutes <= 40) return 30;
    if (minutes <= 55) return 45;
    return 60;
  };

  const formatHours = (hours) => {
    const wholeHours = Math.floor(hours);
    const rawMinutes = (hours - wholeHours) * 60;
    const roundedMinutes = Math.round(rawMinutes);
    return `${wholeHours}:${roundedMinutes.toString().padStart(2, "0")}`;
  };

  const roundTime = (date) => {
    const minutes = date.getMinutes();
    const roundedMinutes = roundMinutes(minutes);

    if (roundedMinutes === 60) {
      date.setHours(date.getHours() + 1, 0, 0, 0);
    } else {
      date.setMinutes(roundedMinutes, 0, 0);
    }

    return date;
  };

  const getDailyHours = (attendanceRecord, day) => {
    const isSpecialDay = isHoliday(day) || isSunday(day);
    const dayHasPassed = isPastDay(day);

    // No attendance record at all
    if (!attendanceRecord) {
      // For past days (Sunday/Holiday): show 12:0 by default
      // For future days (Sunday/Holiday): show 0:0 by default
      if (isSpecialDay && dayHasPassed) {
        return {
          formattedHours: "12:0",
          deductedLunch: "No",
        };
      }
      return {
        formattedHours: "0:0",
        deductedLunch: "No",
      };
    }

    // Day has been removed (cross button clicked)
    if (attendanceRecord?.removeDay) {
      return {
        formattedHours: "0:0",
        deductedLunch: "No",
      };
    }

    const firstLog = attendanceRecord?.timeLogs[0];
    const checkInTime = firstLog?.checkIn;
    const checkOutTime = firstLog?.checkOut;

    // No check-in/check-out (employee didn't work)
    if (!checkInTime || !checkOutTime) {
      // If it's a holiday/Sunday and not removed, give 12 hours (only for past days)
      if (isSpecialDay && !attendanceRecord?.removeDay && dayHasPassed) {
        return {
          formattedHours: "12:0",
          deductedLunch: "No",
        };
      }
      return {
        formattedHours: "0:0",
        deductedLunch: "No",
      };
    }

    // Employee actually worked - calculate actual hours
    let checkInDate = new Date(checkInTime);
    let checkOutDate = new Date(checkOutTime);

    checkInDate = roundTime(checkInDate);
    checkOutDate = roundTime(checkOutDate);

    if (checkInDate.getUTCHours() === 10 && checkInDate.getUTCMinutes() <= 10) {
      checkInDate.setUTCMinutes(0);
    }

    if (checkOutDate < checkInDate) {
      checkOutDate.setDate(checkOutDate.getDate() + 1);
    }

    const checkInMilliseconds = checkInDate.getTime();
    const checkOutMilliseconds = checkOutDate.getTime();
    let totalHours =
      (checkOutMilliseconds - checkInMilliseconds) / (1000 * 60 * 60);

    // Guards don't have lunch deduction
    // Don't add extra 12 hours if employee actually worked - they get paid for actual hours

    return {
      formattedHours: formatHours(totalHours),
      deductedLunch: "No",
    };
  };

  const calculateTotalHours = (attendanceRecords) => {
    let totalHours = 0;
    let totalMinutes = 0;

    daysInMonth?.forEach((day) => {
      const currentDate = new Date(year, month, day);
      const dayString = currentDate.toISOString().split("T")[0];

      const attendanceRecord = attendanceRecords?.find((record) => {
        const recordDate = new Date(record.date).getDate();
        return (
          recordDate === day &&
          new Date(record.date).getFullYear() === year &&
          new Date(record.date).getMonth() === month
        );
      });

      const { formattedHours } = getDailyHours(attendanceRecord, day);
      const [dailyHours, dailyMinutes] = formattedHours.split(":").map(Number);

      totalHours += dailyHours;
      totalMinutes += dailyMinutes;

      if (totalMinutes >= 60) {
        totalHours += Math.floor(totalMinutes / 60);
        totalMinutes %= 60;
      }
    });

    return `${totalHours}:${totalMinutes}`;
  };

  const calculateTotalOvertime = (attendanceRecords) => {
    let totalOvertimeHours = 0;

    daysInMonth?.forEach((day) => {
      const currentDate = new Date(year, month, day);
      const dayString = currentDate.toISOString().split("T")[0];

      const attendanceRecord = attendanceRecords?.find((record) => {
        const recordDate = new Date(record.date)?.toISOString().split("T")[0];
        return recordDate === dayString;
      });

      if (attendanceRecord && !attendanceRecord?.removeDay) {
        const dailyOvertime = calculateOvertimeHours(attendanceRecord, day);
        const [hours, minutes] = dailyOvertime.split(":").map(Number);
        totalOvertimeHours += hours + minutes / 60;
      }
    });

    return formatHours(totalOvertimeHours);
  };

  const calculateOvertimeHours = (attendanceRecord, day) => {
    const dailyHoursData = getDailyHours(attendanceRecord, day);
    const [hours, minutes] = dailyHoursData.formattedHours
      .split(":")
      .map(Number);

    const totalHours = hours + minutes / 60;
    // Guard overtime is anything above 12 hours
    const overtime = totalHours > 12 ? totalHours - 12 : 0;

    return formatHours(overtime);
  };

  const calculateTotalSalary = (monthlySalary, hours, daysInMonth) => {
    const salaryPerMinute = monthlySalary / (daysInMonth * 12 * 60);
    const [hourPart, minutePart] = hours.split(":").map(Number);
    const totalMinutes = hourPart * 60 + minutePart;
    const totalSalary = salaryPerMinute * totalMinutes;
    return Math.round(parseFloat(totalSalary.toFixed(0)));
  };

  const getEffectiveSalary = (employee, month, year) => {
    const relevantSalaries = employee.editedSalary
      ?.filter((record) => {
        const recordDate = new Date(record.date);
        return (
          recordDate.getFullYear() < year ||
          (recordDate.getFullYear() === year && recordDate.getMonth() <= month)
        );
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return relevantSalaries?.length > 0
      ? relevantSalaries[0].amount
      : employee.salary;
  };

  const approveSalaryHandler = (emp, len) => {
    const totalSalary = calculateTotalSalary(
      getEffectiveSalary(emp, month, year),
      calculateTotalHours(emp.attendanceTime),
      len
    );

    const lastDay = new Date(year, month + 1, 0);

    dispatch(
      putSalary({
        month: lastDay,
        amount: totalSalary,
        empId: emp._id,
        leaveTaken: calculateTotalLeaves(emp?.attendanceTime),
      })
    );
  };

  const checkSalaryPaid = (employee) => {
    return employee?.salaryArray?.some((salaryRecord) => {
      const recordMonth = new Date(salaryRecord.month).getMonth();
      const recordYear = new Date(salaryRecord.month).getFullYear();
      return (
        recordMonth === month && recordYear === year && salaryRecord.isPaid
      );
    });
  };

  const disApproveSalaryHandler = (emp, len) => {
    dispatch(
      pullSalary({
        month: new Date(year, month + 1, 0),
        empId: emp._id,
        leaveTaken: calculateTotalLeaves(emp?.attendanceTime),
      })
    );
  };

  const isSalaryApproved = (emp) => {
    if (!emp.salaryArray || emp.salaryArray.length === 0) {
      return false;
    }

    const salaryFound = emp.salaryArray.some((salaryRecord) => {
      const recordMonth = new Date(salaryRecord.month).getMonth() + 1;
      const recordYear = new Date(salaryRecord.month).getFullYear();
      return (
        recordMonth === month + 1 &&
        recordYear === year &&
        salaryRecord.amount !== undefined &&
        salaryRecord?.isSalaryApproved
      );
    });

    return salaryFound;
  };

  const calculateTotalWorkingDays = (attendanceRecords) => {
    let totalDays = 0;

    daysInMonth.forEach((day) => {
      const currentDate = new Date(year, month, day);
      const dayHasPassed = isPastDay(day);

      const attendanceRecord = attendanceRecords.find((record) => {
        const recordDate = new Date(record.date);
        return (
          recordDate.getDate() === currentDate.getDate() &&
          recordDate.getFullYear() === currentDate.getFullYear() &&
          recordDate.getMonth() === currentDate.getMonth()
        );
      });

      if (
        (attendanceRecord && attendanceRecord.timeLogs.length > 0 && !attendanceRecord?.removeDay) ||
        (!attendanceRecord && (isHoliday(day) || isSunday(day)) && dayHasPassed) ||
        (attendanceRecord &&
          attendanceRecord.timeLogs.length === 0 &&
          attendanceRecord.removeDay === false &&
          (isHoliday(day) || isSunday(day)) &&
          dayHasPassed)
      ) {
        totalDays++;
      }
    });

    return totalDays;
  };

  const calculateTotalLeaves = (attendanceRecords) => {
    let totalLeaves = 0;

    daysInMonth.forEach((day) => {
      const currentDate = new Date(year, month, day);
      const attendanceRecord = attendanceRecords.find((record) => {
        const recordDate = new Date(record.date);
        return (
          recordDate.getDate() === currentDate.getDate() &&
          recordDate.getFullYear() === currentDate.getFullYear() &&
          recordDate.getMonth() === currentDate.getMonth()
        );
      });

      const isCurrentDayHoliday = isHoliday(day);
      const isCurrentDaySunday = isSunday(day);
      const dayHasPassed = isPastDay(day);

      if (!attendanceRecord && !isCurrentDayHoliday && !isCurrentDaySunday && dayHasPassed) {
        totalLeaves++;
      }
    });

    return totalLeaves;
  };

  const totalPages = Math.ceil(employees?.length / entriesPerPage);
  const currentEmployees = employees
    ?.filter(
      (employee) =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  const csvData = useMemo(() => {
    if (!currentEmployees) return [];

    return currentEmployees.map((employee, idx) => {
      const dailyHours = daysInMonth.map((day) => {
        const attendanceRecord = employee?.attendanceTime?.find((record) => {
          const recordDate = new Date(record.date).getDate();
          return (
            recordDate === day &&
            new Date(record.date).getFullYear() === year &&
            new Date(record.date).getMonth() === month
          );
        });

        const { formattedHours } = getDailyHours(attendanceRecord, day);
        return formattedHours || 0;
      });

      const totalWorkingDays = calculateTotalWorkingDays(
        employee.attendanceTime
      );
      const totalOvertime = calculateTotalOvertime(employee.attendanceTime);
      const totalHours = calculateTotalHours(employee.attendanceTime);
      const totalSalary = calculateTotalSalary(
        getEffectiveSalary(employee, month, year),
        totalHours,
        daysInMonth.length
      );

      return {
        serialNumber: idx + 1,
        name: employee.name,
        employeeCode: employee.employeeCode,
        ...dailyHours.reduce((acc, hours, index) => {
          acc[`day${index + 1}`] = hours;
          return acc;
        }, {}),
        totalWorkingDays: totalWorkingDays,
        totalOvertime: totalOvertime,
        totalHours: totalHours,
        totalSalary: totalSalary,
      };
    });
  }, [currentEmployees, daysInMonth, year, month]);

  const removeDayPaid = (empId, day) => {
    let newDay = day < 10 ? `0${day}` : day;
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${newDay}`;
    dispatch(removeDay({ empId, date }));
  };

  const restoreDayPaid = (empId, day) => {
    let newDay = day < 10 ? `0${day}` : day;
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${newDay}`;
    dispatch(restoreDay({ empId, date }));
  };

  const totalSalaryToBePaid = useMemo(() => {
    return currentEmployees?.reduce((acc, employee) => {
      const totalHours = calculateTotalHours(employee.attendanceTime);
      const totalSalary = calculateTotalSalary(
        getEffectiveSalary(employee, month, year),
        totalHours,
        daysInMonth.length
      );
      return acc + (totalSalary || 0);
    }, 0);
  }, [currentEmployees, daysInMonth, month, year]);

  const formattedTotalSalaryToBePaid = totalSalaryToBePaid ? totalSalaryToBePaid.toFixed(2) : "0.00";

  return (
    <Box p={8} mt={100} backgroundColor={"white"} borderRadius={"30px"}>
      {/* Display total salary to be paid */}
      <Box mb={4}>
        <Text fontSize="lg" fontWeight="bold">
          Total Salary to be Paid: ₹ {formattedTotalSalaryToBePaid}
        </Text>
      </Box>

      {/* Year and Month Selection */}
      <Box display="flex" alignItems="center" gap={4} mb={4} id="table-col">
        <Box>
          <Text mb={2}>Year:</Text>
          <Input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            min="2000"
            max="2100"
            width="100px"
            id="full-width"
          />
        </Box>
        <Box>
          <Text mb={2}>Month:</Text>
          <Select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            width="150px"
            id="full-width"
          >
            {Array?.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {new Date(0, i).toLocaleString("en", { month: "long" })}
              </option>
            ))}
          </Select>
        </Box>
        <Box width={"40%"} id="full-width">
          <Text mb={2}>Search</Text>
          <Input
            placeholder="Search employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Box>
      </Box>

      {/* Entries per page selection */}
      <Box
        display="flex"
        alignItems="end"
        justifyContent="space-between"
        gap={4}
        mb={4}
        id="table-col"
      >
        <Box mb={4}>
          <Text mb={2}>Entries per page:</Text>
          <Select
            value={entriesPerPage}
            onChange={(e) => setEntriesPerPage(Number(e.target.value))}
            width="150px"
          >
            {[50, 75, 100].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Box>

        <Button colorScheme="green" display={"flex"} gap={3} mb={4}>
          <CSVLink
            data={csvData}
            filename={"Guard_attendance.csv"}
            className="btn btn-primary"
            target="_blank"
          >
            Export to Excel
          </CSVLink>
          <FaDownload />
        </Button>
      </Box>

      {/* Attendance Table */}
      <TableContainer maxHeight={"100vh"} overflowY="auto">
        <Table>
          <Thead id="head-fixed">
            <Tr>
              <Th>S.No</Th>
              <Th id="col-fixed">Employee Name</Th>
              <Th>Employee Code</Th>
              {daysInMonth.map((day) => (
                <Th key={day} style={(isHoliday(day) || isSunday(day)) ? { color: "red" } : {}}>
                  {isSunday(day)
                    ? `${day}(SUN)`
                    : isHoliday(day)
                    ? `${day}(${getHolidayNameByDate(day)})`
                    : day}
                </Th>
              ))}
              <Th>Total Working Days</Th>
              <Th>Overtime Hours</Th>
              <Th>Total Hours</Th>
              <Th>Total Salary</Th>
              <Th>Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {currentEmployees?.map((employee, idx) => (
              <Tr key={employee._id}>
                <Td>{idx + 1}</Td>
                <Td id="col-fixed">{employee.name}</Td>
                <Td>{employee.employeeCode}</Td>
                {daysInMonth.map((day) => {
                  const attendanceRecord = employee.attendanceTime.find(
                    (record) => {
                      const recordDate = new Date(record.date).getDate();
                      return (
                        recordDate === day &&
                        new Date(record.date).getFullYear() === year &&
                        new Date(record.date).getMonth() === month
                      );
                    }
                  );

                  const { formattedHours } = getDailyHours(
                    attendanceRecord,
                    day
                  );

                  const isSpecialDay = isHoliday(day) || isSunday(day);
                  const dayHasPassed = isPastDay(day);

                  return (
                    <Td key={day}>
                      {formattedHours}
                      {/* Show buttons ONLY for Sundays and Holidays that have passed */}
                      {isSpecialDay && dayHasPassed && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            marginTop: "5px",
                            gap: "5px",
                            fontSize: "20px",
                          }}
                        >
                          <RxCrossCircled
                            color="red"
                            style={{ cursor: "pointer" }}
                            onClick={() => removeDayPaid(employee._id, day)}
                            title="Remove holiday pay"
                          />
                          <TiTick
                            color="green"
                            style={{ cursor: "pointer" }}
                            onClick={() => restoreDayPaid(employee._id, day)}
                            title="Restore holiday pay"
                          />
                        </div>
                      )}
                    </Td>
                  );
                })}
                <Td>{calculateTotalWorkingDays(employee.attendanceTime)}</Td>
                <Td>{calculateTotalOvertime(employee.attendanceTime)}</Td>
                <Td>{calculateTotalHours(employee.attendanceTime)}</Td>
                <Td>
                  {calculateTotalSalary(
                    getEffectiveSalary(employee, month, year),
                    calculateTotalHours(employee.attendanceTime),
                    daysInMonth.length
                  )}
                </Td>
                <Td>
                  {checkSalaryPaid(employee) ? (
                    <div>
                      <Button
                        colorScheme="gray"
                        onClick={() =>
                          approveSalaryHandler(employee, daysInMonth.length)
                        }
                      >
                        Paid
                      </Button>
                    </div>
                  ) : (
                    <Button
                      colorScheme={isSalaryApproved(employee) ? "red" : "green"}
                      onClick={() =>
                        !isSalaryApproved(employee)
                          ? approveSalaryHandler(employee, daysInMonth.length)
                          : disApproveSalaryHandler(
                              employee,
                              daysInMonth.length
                            )
                      }
                    >
                      {isSalaryApproved(employee) ? "Disapprove" : "Approve"}
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>

      {/* Pagination Controls */}
      <HStack justifyContent="space-between" mt={4}>
        <Button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          isDisabled={currentPage === 1}
        >
          Previous
        </Button>
        <Text>
          Page {currentPage} of {totalPages}
        </Text>
        <Button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          isDisabled={currentPage === totalPages}
        >
          Next
        </Button>
      </HStack>
    </Box>
  );
};

export default GuardAttendanceTable;