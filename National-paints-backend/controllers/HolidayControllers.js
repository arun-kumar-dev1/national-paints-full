const asyncHandler = require('express-async-handler');
const HolidayModel = require('../models/HolidayModel');

const addHoliday = asyncHandler(async (req, res) => {
    try {
        const newHoliday = await HolidayModel.create(req.body);
        res.status(201).json(newHoliday);
    } catch (err) {
        res.status(500).json({ message: 'Failed to add Holiday', error: err.message });
    }
});

const editHoliday = asyncHandler(async (req, res) => {
    try {
        const {id} = req.params
        const editedHoliday = await HolidayModel.findByIdAndUpdate(id,req.body)
        res.status(201).json(editedHoliday);
    } catch (err) {
        res.status(500).json({ message: 'Failed to edit Holiday', error: err.message });
    }
});

const deleteHoliday = asyncHandler(async (req, res) => {
    try {
        const {id} = req.params
        const deletedHoliday = await HolidayModel.findByIdAndDelete(id)
        res.status(201).json(deletedHoliday);
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete Holiday', error: err.message });
    }
});



const getAllHoliday = asyncHandler(async (req, res) => {
    try {
        const allHoliday = await HolidayModel.find();

        console.log(allHoliday)
        res.status(201).json(allHoliday);
    } catch (err) {
        res.status(500).json({ message: 'Failed to add Holiday', error: err.message });
    }
});


module.exports = {
    addHoliday,
    getAllHoliday,
    editHoliday,
    deleteHoliday
};
