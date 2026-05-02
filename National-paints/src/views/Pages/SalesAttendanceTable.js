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
import { removeHalfDay } from "features/Attendance/AttendanceSlice";
import { restoreHalfDay } from "features/Attendance/AttendanceSlice";

const SalesAttendanceTable = () => {
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
    (employee) => employee.empType === "sales" && !employee.delete
  );

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  const { monthSalary } = useSelector((state) => state.employee);
  const {
    removedDay,
    restoredDay,
    removedHalfDay,
    restoredHalfDay,
  } = useSelector((state) => state.attendance);

  useEffect(() => {
    dispatch(allEmployee());
    dispatch(allHoliday());
  }, [
    dispatch,
    monthSalary,
    removedDay,
    restoredDay,
    removedHalfDay,
    restoredHalfDay,
  ]);

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

  const isSunday = (date) => {
    return new Date(year, month, date).getDay() === 0;
  };

  const formatHours = (totalHoursDecimal) => {
    const hours = Math.floor(totalHoursDecimal);
    const minutes = Math.round((totalHoursDecimal - hours) * 60);
    return `${hours} : ${minutes}`;
  };

  const totalPages = Math.ceil(employees?.length / entriesPerPage);
  const currentEmployees = employees
    ?.filter(
      (employee) =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  let consecutiveDailyLateDays = 0;

  const getAttendance = (attendanceRecord, day) => {
    const isSpecialDay = isHoliday(day) || isSunday(day);
    const dayHasPassed = isPastDay(day);

    // No attendance record
    if (!attendanceRecord) {
      // Past Sunday/Holiday: P (paid), Future: A (absent)
      if (isSpecialDay && dayHasPassed) {
        return "P";
      }
      return "A";
    }

    // Day removed via cross button
    if (attendanceRecord?.removeDay) {
      return "A";
    }

    if (attendanceRecord?.timeLogs?.length > 0) {
      const firstLog = attendanceRecord.timeLogs[0];
      const checkInTime = firstLog.checkIn;
      const checkOutTime = firstLog.checkOut;

      if (!checkInTime || !checkOutTime) {
        // No check-in/out on special day that has passed = P
        if (isSpecialDay && dayHasPassed && !attendanceRecord?.removeDay) {
          return "P";
        }
        return "A";
      }

      let checkInDate = new Date(checkInTime);
      let checkOutDate = new Date(checkOutTime);

      const checkInHour = checkInDate.getUTCHours();
      const checkOutHour = checkOutDate.getUTCHours();

      // Half day logic
      if ((checkInHour <= 14 && checkOutHour <= 14) || (checkInHour >= 14 && checkOutHour >= 14)) {
        return !attendanceRecord?.removeHalfDay ? "Half day" : "P";
      } else if (checkInHour <= 13) {
        return "P";
      }
    }

    // Special day with no time logs but not removed = P
    if (isSpecialDay && dayHasPassed && !attendanceRecord?.removeDay) {
      return "P";
    }

    if (!attendanceRecord.removeDay) {
      return "P";
    }

    return "A";
  };

  const calculateTotalDays = (attendanceRecords) => {
    let totalDaysWorked = 0;
    let totalHalfDays = 0;
    let totalAbsences = 0;

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

      const attend = getAttendance(attendanceRecord, day);

      if (attend === "P") {
        totalDaysWorked++;
      } else if (attend === "A") {
        totalAbsences++;
      } else {
        totalHalfDays++;
      }
    });

    totalDaysWorked += totalHalfDays * 0.5;
    return totalDaysWorked.toFixed(1);
  };

  const calculateTotalSalary = (salary, attendanceRecords) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalDaysWorked = calculateTotalDays(attendanceRecords);
    const dailySalary = salary / daysInMonth;
    const totalSalary = dailySalary * totalDaysWorked;
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
      emp.attendanceTime
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

  const calculateTotalLeaves = (attendanceRecords) => {
    let totalLeaves = 0;
    const totalHalfDays = calculateTotalHalfDays(attendanceRecords);

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

      if (
        (!attendanceRecord && !isCurrentDayHoliday && !isCurrentDaySunday && dayHasPassed) ||
        attendanceRecord?.removeDay
      ) {
        totalLeaves++;
      }
    });

    return totalLeaves + (totalHalfDays * 0.5);
  };

  const calculateTotalHalfDays = (attendanceRecords) => {
    let totalHalfDays = 0;

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

      const attend = getAttendance(attendanceRecord, day);

      if (attend !== "P" && attend !== "A") {
        totalHalfDays++;
      }
    });

    return totalHalfDays;
  };

  const csvData = useMemo(() => {
    if (!employees) return [];

    return employees.map((employee, index) => {
      const attendance = daysInMonth.reduce((acc, day) => {
        const attendanceRecord = employee.attendanceTime?.find((record) => {
          const recordDate = new Date(record.date);
          return (
            recordDate.getDate() === day &&
            recordDate.getFullYear() === year &&
            recordDate.getMonth() === month
          );
        });

        const status = getAttendance(attendanceRecord, day);
        return { ...acc, [`day${day}`]: status };
      }, {});

      return {
        serialNo: index + 1,
        name: employee.name,
        employeeCode: employee.employeeCode,
        ...attendance,
        totalLeaves: calculateTotalLeaves(employee.attendanceTime),
        totalHalfDays: calculateTotalHalfDays(employee.attendanceTime),
        totalDays: calculateTotalDays(employee.attendanceTime || []),
        totalSalary: calculateTotalSalary(
          employee.salary,
          employee.attendanceTime || []
        ),
      };
    });
  }, [employees, daysInMonth, year, month]);

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

  const removeHalfPaid = (empId, day) => {
    let newDay = day < 10 ? `0${day}` : day;
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${newDay}`;
    dispatch(removeHalfDay({ empId, date }));
  };

  const restoreHalfPaid = (empId, day) => {
    let newDay = day < 10 ? `0${day}` : day;
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${newDay}`;
    dispatch(restoreHalfDay({ empId, date }));
  };

  const totalSalaryToBePaid = useMemo(() => {
    return currentEmployees?.reduce((acc, employee) => {
      const totalSalary = calculateTotalSalary(
        getEffectiveSalary(employee, month, year),
        employee.attendanceTime
      );
      return acc + parseFloat(totalSalary);
    }, 0);
  }, [currentEmployees, month, year]);

  const formattedTotalSalaryToBePaid = totalSalaryToBePaid
    ? totalSalaryToBePaid.toFixed(2)
    : "0.00";

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
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {new Date(0, i).toLocaleString("en", { month: "long" })}
              </option>
            ))}
          </Select>
        </Box>
        <Box width={"40%"} id="full-width">
          <Text mb={2}>Search Employee</Text>
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

        <Button colorScheme="green" mb={4} display={"flex"} gap={3}>
          <CSVLink
            data={csvData}
            filename={`salesAttendance.csv`}
            className="btn btn-primary"
            target="_blank"
          >
            Export to Excel
          </CSVLink>
          <FaDownload />
        </Button>
      </Box>

      <TableContainer maxHeight={"100vh"} overflowY="auto">
        <Table>
          <Thead id="head-fixed">
            <Tr>
              <Th>S.No</Th>
              <Th id="col-fixed">Employee Name</Th>
              <Th>Employee Code</Th>
              {daysInMonth?.map((day) => (
                <Th key={day} style={(isHoliday(day) || isSunday(day)) ? { color: "red" } : {}}>
                  {isSunday(day)
                    ? day + "(SUN)"
                    : isHoliday(day)
                    ? day + `(${getHolidayNameByDate(day)})`
                    : day}
                </Th>
              ))}
              <Th>Leaves</Th>
              <Th>Half Days</Th>
              <Th>Present Days</Th>
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
                {daysInMonth?.map((day) => {
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

                  const isSpecialDay = isHoliday(day) || isSunday(day);
                  const dayHasPassed = isPastDay(day);
                  const attendanceStatus = getAttendance(attendanceRecord, day);

                  return (
                    <Td key={day}>
                      {attendanceStatus}
                      {/* Cross/Tick buttons for Sundays and Holidays that have passed */}
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
                            title="Mark as Absent"
                          />
                          <TiTick
                            color="green"
                            style={{ cursor: "pointer" }}
                            onClick={() => restoreDayPaid(employee._id, day)}
                            title="Mark as Present"
                          />
                        </div>
                      )}

                      {/* Half day buttons */}
                      {attendanceStatus === "Half day" && (
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
                            onClick={() => removeHalfPaid(employee._id, day)}
                            title="Remove half day"
                          />
                          <TiTick
                            color="green"
                            style={{ cursor: "pointer" }}
                            onClick={() => restoreHalfPaid(employee._id, day)}
                            title="Restore half day"
                          />
                        </div>
                      )}
                    </Td>
                  );
                })}
                <Td>{calculateTotalLeaves(employee?.attendanceTime)}</Td>
                <Td>{calculateTotalHalfDays(employee?.attendanceTime)}</Td>
                <Td>{calculateTotalDays(employee?.attendanceTime)}</Td>
                <Td>
                  {calculateTotalSalary(
                    getEffectiveSalary(employee, month, year),
                    employee?.attendanceTime
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

export default SalesAttendanceTable;