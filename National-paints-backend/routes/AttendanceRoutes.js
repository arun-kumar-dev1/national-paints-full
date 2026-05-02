const express = require('express');
const { checkin,checkout, getAttendance, getMonthlyAttendance, todaysPresent, todaysAbsent, todaysAvailable, editAttendanceTime, todaysLeft, deleteAttendance, guardCheckIn, RemoveDay, RestoreDay, RemoveHalfDay, RestoreHalfDay } = require('../controllers/AttendanceControllers');
const { isReceptionist } = require('../middlewares/authMiddlewares');
const router = express.Router();


router.post('/checkin', checkin);

router.post('/guardcheckin', guardCheckIn);

router.post('/checkout', checkout);

router.get('/todays-present', todaysPresent);

router.get('/todays-absent', todaysAbsent);

router.get('/todays-avail', todaysAvailable);

router.get('/todays-left', todaysLeft);

router.put('/edit-attendance-time', editAttendanceTime);

router.delete('/delete/:date/:empId', deleteAttendance);

router.put('/remove-day', RemoveDay);

router.put('/restore-day', RestoreDay);

router.put('/remove-half-day', RemoveHalfDay);

router.put('/restore-half-day', RestoreHalfDay);

module.exports = router;