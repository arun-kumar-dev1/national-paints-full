const express = require('express');
const { addHoliday, getAllHoliday, editHoliday, deleteHoliday } = require('../controllers/HolidayControllers');
const router = express.Router();


router.post('/add', addHoliday);

router.get('/all', getAllHoliday);

router.put('/:id', editHoliday);
router.delete('/:id', deleteHoliday);



module.exports = router;